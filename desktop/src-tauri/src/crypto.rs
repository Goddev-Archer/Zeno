// --- ZENO CORE CRYPTO MODULE (RUST BACKEND) ---
// High-security cryptographic identity, ECDSA P-256 signing, SHA-256 AIN derivation,
// and hardware-accelerated AES-256-GCM Vault encryption with memory zeroization.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use p256::ecdsa::{
    signature::{Signer, Verifier},
    Signature, SigningKey, VerifyingKey,
};
use p256::pkcs8::{DecodePrivateKey, DecodePublicKey, EncodePrivateKey, EncodePublicKey};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngCore;
use zeroize::Zeroize;
use bip39::Mnemonic;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserIdentity {
    pub ain: String,
    pub public_key_hex: String,
    pub private_key_encrypted_hex: Option<String>,
    pub mnemonic: Option<String>,
    pub fingerprint: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EncryptedVaultBlob {
    pub ciphertext_hex: String,
    pub iv_hex: String,
    pub salt_hex: String,
    pub timestamp: String,
}

/// Derives deterministic Account Identifier Number (AIN) and SHA-256 Fingerprint
pub fn derive_ain_from_public_key(pub_key_bytes: &[u8]) -> (String, String) {
    let mut hasher = Sha256::new();
    hasher.update(pub_key_bytes);
    let hash = hasher.finalize();
    let hash_hex = hex::encode_upper(hash);

    let clean = hash_hex.replace(|c: char| !c.is_ascii_hexdigit(), "");
    let seg1 = if clean.len() >= 4 { &clean[0..4] } else { "8F3A" };
    let seg2 = if clean.len() >= 8 { &clean[4..8] } else { "9B21" };
    let seg3 = if clean.len() >= 12 { &clean[8..12] } else { "44E2" };

    let ain = format!("ZENO-{}-{}-{}", seg1, seg2, seg3);

    // Fingerprint format: SHA256:8F:3A:9B:21:...
    let pairs: Vec<String> = clean
        .as_bytes()
        .chunks(2)
        .take(8)
        .map(|chunk| std::str::from_utf8(chunk).unwrap_or("00").to_string())
        .collect();
    let fingerprint = format!("SHA256:{}", pairs.join(":"));

    (ain, fingerprint)
}

/// Generates a brand new 256-bit ECDSA P-256 cryptographic identity
pub fn generate_identity() -> Result<UserIdentity, String> {
    let mut rng = rand::rngs::OsRng;
    let signing_key = SigningKey::random(&mut rng);
    let verifying_key = VerifyingKey::from(&signing_key);

    // Export private key as PKCS#8 DER
    let doc = signing_key
        .to_pkcs8_der()
        .map_err(|e| format!("Fehler beim Kodieren des privaten Schlüssels: {}", e))?;
    let mut priv_bytes = doc.as_bytes().to_vec();
    let priv_key_hex = hex::encode_upper(&priv_bytes);
    priv_bytes.zeroize(); // Wipe sensitive private key from stack

    // Export public key as SPKI DER
    let pub_doc = verifying_key
        .to_public_key_der()
        .map_err(|e| format!("Fehler beim Kodieren des öffentlichen Schlüssels: {}", e))?;
    let pub_bytes = pub_doc.as_bytes();
    let pub_key_hex = hex::encode_upper(pub_bytes);

    let (ain, fingerprint) = derive_ain_from_public_key(pub_bytes);

    Ok(UserIdentity {
        ain,
        public_key_hex: pub_key_hex,
        private_key_encrypted_hex: Some(priv_key_hex),
        mnemonic: None,
        fingerprint,
        created_at: chrono_like_now(),
    })
}

/// Generates a Sovereign BIP-39 12-word cryptographic identity with deterministic ECDSA P-256 keypair
pub fn generate_sovereign_identity() -> Result<UserIdentity, String> {
    let mut entropy = [0u8; 16];
    rand::rngs::OsRng.fill_bytes(&mut entropy);
    let mnemonic = Mnemonic::from_entropy(&entropy)
        .map_err(|e| format!("Fehler bei BIP-39 Entropie: {:?}", e))?;
    
    let words = mnemonic.to_string();
    import_sovereign_identity(&words)
}

/// Restores an ECDSA P-256 sovereign identity deterministically from a 12-word BIP-39 mnemonic
pub fn import_sovereign_identity(words: &str) -> Result<UserIdentity, String> {
    let clean_words = words.trim().to_lowercase();
    let mnemonic = Mnemonic::parse_normalized(&clean_words)
        .map_err(|e| format!("Ungültige BIP-39 Wörter: {:?}", e))?;

    // Derive 512-bit seed
    let seed = mnemonic.to_seed("");
    // SHA-256 of seed to guarantee valid 32-byte scalar
    let mut hasher = Sha256::new();
    hasher.update(&seed);
    let scalar_bytes = hasher.finalize();

    let signing_key = SigningKey::from_slice(&scalar_bytes)
        .map_err(|e| format!("Fehler beim Ableiten des ECDSA Schlüssels: {:?}", e))?;
    let verifying_key = VerifyingKey::from(&signing_key);

    let doc = signing_key
        .to_pkcs8_der()
        .map_err(|e| format!("Fehler beim Kodieren des privaten Schlüssels: {}", e))?;
    let mut priv_bytes = doc.as_bytes().to_vec();
    let priv_key_hex = hex::encode_upper(&priv_bytes);
    priv_bytes.zeroize();

    let pub_doc = verifying_key
        .to_public_key_der()
        .map_err(|e| format!("Fehler beim Kodieren des öffentlichen Schlüssels: {}", e))?;
    let pub_bytes = pub_doc.as_bytes();
    let pub_key_hex = hex::encode_upper(pub_bytes);

    let (ain, fingerprint) = derive_ain_from_public_key(pub_bytes);

    Ok(UserIdentity {
        ain,
        public_key_hex: pub_key_hex,
        private_key_encrypted_hex: Some(priv_key_hex),
        mnemonic: Some(clean_words),
        fingerprint,
        created_at: chrono_like_now(),
    })
}

/// Signs a server authentication nonce challenge with the private key
pub fn sign_challenge(nonce: &str, private_key_hex: &str) -> Result<String, String> {
    let mut priv_bytes = hex::decode(private_key_hex)
        .map_err(|e| format!("Ungültiges Hex-Format für privaten Schlüssel: {}", e))?;

    let signing_key = SigningKey::from_pkcs8_der(&priv_bytes)
        .map_err(|e| format!("Fehler beim Parsen des privaten Schlüssels: {}", e))?;
    priv_bytes.zeroize();

    let signature: Signature = signing_key.sign(nonce.as_bytes());
    let sig_bytes = signature.to_der();

    Ok(hex::encode_upper(sig_bytes.as_bytes()))
}

/// Verifies an ECDSA signature mathematically against public key and nonce
pub fn verify_signature(
    nonce: &str,
    signature_hex: &str,
    public_key_hex: &str,
) -> Result<bool, String> {
    let pub_bytes = hex::decode(public_key_hex)
        .map_err(|e| format!("Ungültiges Hex-Format für öffentlichen Schlüssel: {}", e))?;
    let sig_bytes = hex::decode(signature_hex)
        .map_err(|e| format!("Ungültiges Hex-Format für Signatur: {}", e))?;

    let verifying_key = VerifyingKey::from_public_key_der(&pub_bytes)
        .map_err(|e| format!("Fehler beim Parsen des öffentlichen Schlüssels: {}", e))?;

    let signature = Signature::from_der(&sig_bytes)
        .map_err(|e| format!("Fehler beim Parsen der Signatur: {}", e))?;

    match verifying_key.verify(nonce.as_bytes(), &signature) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// AES-256-GCM Vault Encryption (PBKDF2-HMAC-SHA256, 100,000 Iterations)
pub fn encrypt_vault(plaintext: &str, passcode: &str) -> Result<EncryptedVaultBlob, String> {
    let mut salt = [0u8; 16];
    let mut iv = [0u8; 12];
    rand::rngs::OsRng.fill_bytes(&mut salt);
    rand::rngs::OsRng.fill_bytes(&mut iv);

    // Derive 256-bit AES key via PBKDF2
    let mut derived_key = [0u8; 32];
    pbkdf2::pbkdf2_hmac::<Sha256>(passcode.as_bytes(), &salt, 100_000, &mut derived_key);

    let cipher = Aes256Gcm::new_from_slice(&derived_key)
        .map_err(|e| format!("Cipher-Fehler: {}", e))?;
    derived_key.zeroize();

    let nonce = Nonce::from_slice(&iv);
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Verschlüsselung fehlgeschlagen: {}", e))?;

    Ok(EncryptedVaultBlob {
        ciphertext_hex: hex::encode_upper(ciphertext),
        iv_hex: hex::encode_upper(iv),
        salt_hex: hex::encode_upper(salt),
        timestamp: chrono_like_now(),
    })
}

/// AES-256-GCM Vault Decryption
pub fn decrypt_vault(vault: &EncryptedVaultBlob, passcode: &str) -> Result<String, String> {
    let salt = hex::decode(&vault.salt_hex)
        .map_err(|e| format!("Ungültiger Salt-Hex: {}", e))?;
    let iv = hex::decode(&vault.iv_hex)
        .map_err(|e| format!("Ungültiger IV-Hex: {}", e))?;
    let ciphertext = hex::decode(&vault.ciphertext_hex)
        .map_err(|e| format!("Ungültiger Ciphertext-Hex: {}", e))?;

    if salt.len() != 16 || iv.len() != 12 {
        return Err("Ungültige Salt- oder IV-Länge.".to_string());
    }

    let mut derived_key = [0u8; 32];
    pbkdf2::pbkdf2_hmac::<Sha256>(passcode.as_bytes(), &salt, 100_000, &mut derived_key);

    let cipher = Aes256Gcm::new_from_slice(&derived_key)
        .map_err(|e| format!("Cipher-Fehler: {}", e))?;
    derived_key.zeroize();

    let nonce = Nonce::from_slice(&iv);
    let decrypted_bytes = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "Entschlüsselung fehlgeschlagen (Falsches Passwort oder korrupte Daten).".to_string())?;

    String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("Ungültiges UTF-8 nach Entschlüsselung: {}", e))
}

fn chrono_like_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    format!("{}Z", duration.as_secs())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sovereign_identity_generation_format() {
        let identity = generate_sovereign_identity().expect("Generation should succeed");
        assert!(identity.ain.starts_with("ZENO-"));
        assert!(identity.fingerprint.starts_with("SHA256:"));
        let mnemonic = identity.mnemonic.expect("Mnemonic must be present");
        let words: Vec<&str> = mnemonic.split_whitespace().collect();
        assert_eq!(words.len(), 12, "Must be exactly 12 words");
    }

    #[test]
    fn test_sovereign_identity_import_deterministic() {
        let original = generate_sovereign_identity().expect("Generation should succeed");
        let words = original.mnemonic.as_ref().unwrap();
        
        let restored = import_sovereign_identity(words).expect("Import should succeed");
        assert_eq!(original.ain, restored.ain);
        assert_eq!(original.public_key_hex, restored.public_key_hex);
        assert_eq!(original.fingerprint, restored.fingerprint);
    }

    #[test]
    fn test_signature_sign_and_verify() {
        let identity = generate_sovereign_identity().expect("Generation should succeed");
        let priv_hex = identity.private_key_encrypted_hex.as_ref().unwrap();
        let pub_hex = &identity.public_key_hex;

        let challenge = "Zeno-Auth-Challenge-Test-Payload-12345";
        let sig_hex = sign_challenge(challenge, priv_hex).expect("Signing must succeed");

        let is_valid = verify_signature(challenge, &sig_hex, pub_hex).expect("Verification must not error");
        assert!(is_valid, "Valid signature must pass verification");

        let tampered_challenge = "Zeno-Auth-Challenge-Tampered";
        let is_valid_tampered = verify_signature(tampered_challenge, &sig_hex, pub_hex).expect("Verification must not error");
        assert!(!is_valid_tampered, "Tampered challenge must fail verification");
    }

    #[test]
    fn test_vault_encryption_and_decryption_roundtrip() {
        let secret = "Ultra-Sensitive-Server-Secret-Mnemonic-Key";
        let passcode = "CorrectHorseBatteryStaple#2026";

        let vault = encrypt_vault(secret, passcode).expect("Encryption must succeed");
        assert_eq!(vault.salt_hex.len(), 32); // 16 bytes = 32 hex chars
        assert_eq!(vault.iv_hex.len(), 24);   // 12 bytes = 24 hex chars

        let decrypted = decrypt_vault(&vault, passcode).expect("Decryption must succeed");
        assert_eq!(decrypted, secret);

        let wrong_passcode = "WrongPassword!";
        let failed_decrypt = decrypt_vault(&vault, wrong_passcode);
        assert!(failed_decrypt.is_err(), "Decryption with wrong password must fail");
    }
}
