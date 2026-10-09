// --- ZENO REAL AUDIO STREAMING ENGINE & WEBRTC SERVICE ---
// Web Audio API, AnalyserNode, RMS Voice Activity Detection (VAD), 
// Push-To-Talk (PTT), Loopback Echo Test, and WebRTC Peer Connections.

import { updateVoiceSpeaking, sendVoiceSignal, VoiceSignalPayload } from "./voiceNetworkService";
import { audioE2EEngine, VoiceE2EEStats } from "./audioE2EEngine";

export interface AudioSettingsConfig {
  inputDeviceId: string;
  outputDeviceId: string;
  inputVolume: number; // 0.0 to 2.0 (1.0 = 100%)
  outputVolume: number; // 0.0 to 1.0 (1.0 = 100%)
  inputMode: "vad" | "ptt"; // Voice Activity Detection vs. Push-to-Talk
  vadThreshold: number; // 0.01 to 0.50 (default 0.04)
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput";
}

class AudioStreamService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private inputGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private testGainNode: GainNode | null = null;

  // Analysis & VAD state
  private animationFrameId: number | null = null;
  private isAnalyzing: boolean = false;
  private currentRms: number = 0;
  private isSpeaking: boolean = false;
  private lastSpeakingTimestamp: number = 0;
  private readonly HANGOVER_TIME_MS: number = 320; // Keeps speech active between words
  private lastRustBroadcastTime: number = 0;

  // Hardware states
  private isMuted: boolean = false;
  private isDeafened: boolean = false;
  private isPttActive: boolean = false;
  private isTestingMic: boolean = false;

  // WebRTC Peer Connections
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();

  // Settings
  private config: AudioSettingsConfig = {
    inputDeviceId: localStorage.getItem("zeno_audio_input_device") || "",
    outputDeviceId: localStorage.getItem("zeno_audio_output_device") || "",
    inputVolume: parseFloat(localStorage.getItem("zeno_audio_input_vol") || "1.0"),
    outputVolume: parseFloat(localStorage.getItem("zeno_audio_output_vol") || "1.0"),
    inputMode: (localStorage.getItem("zeno_audio_input_mode") as any) || "vad",
    vadThreshold: parseFloat(localStorage.getItem("zeno_audio_vad_threshold") || "0.04"),
    echoCancellation: localStorage.getItem("zeno_audio_echo_cancel") !== "false",
    noiseSuppression: localStorage.getItem("zeno_audio_noise_suppr") !== "false",
    autoGainControl: localStorage.getItem("zeno_audio_auto_gain") !== "false",
  };

  // Callbacks
  private levelListeners: Set<(rms: number, isSpeaking: boolean) => void> = new Set();
  private speakingListeners: Set<(isSpeaking: boolean, rms: number) => void> = new Set();

  constructor() {
    this.setupPttGlobalListeners();
  }

  public getCurrentRms(): number {
    return this.currentRms;
  }

  public getConfig(): AudioSettingsConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<AudioSettingsConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem("zeno_audio_input_device", this.config.inputDeviceId);
    localStorage.setItem("zeno_audio_output_device", this.config.outputDeviceId);
    localStorage.setItem("zeno_audio_input_vol", this.config.inputVolume.toString());
    localStorage.setItem("zeno_audio_output_vol", this.config.outputVolume.toString());
    localStorage.setItem("zeno_audio_input_mode", this.config.inputMode);
    localStorage.setItem("zeno_audio_vad_threshold", this.config.vadThreshold.toString());
    localStorage.setItem("zeno_audio_echo_cancel", this.config.echoCancellation.toString());
    localStorage.setItem("zeno_audio_noise_suppr", this.config.noiseSuppression.toString());
    localStorage.setItem("zeno_audio_auto_gain", this.config.autoGainControl.toString());

    if (this.inputGainNode) {
      this.inputGainNode.gain.value = this.config.inputVolume;
    }
  }

  /**
   * Enumerate connected input & output audio devices
   */
  public async getAvailableDevices(): Promise<{ inputs: AudioDeviceInfo[]; outputs: AudioDeviceInfo[] }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return { inputs: [], outputs: [] };
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs: AudioDeviceInfo[] = [];
      const outputs: AudioDeviceInfo[] = [];

      devices.forEach((d, idx) => {
        if (d.kind === "audioinput") {
          inputs.push({
            deviceId: d.deviceId || `mic-${idx}`,
            label: d.label || `Mikrofon ${inputs.length + 1}`,
            kind: "audioinput"
          });
        } else if (d.kind === "audiooutput") {
          outputs.push({
            deviceId: d.deviceId || `speaker-${idx}`,
            label: d.label || `Lautsprecher / Headset ${outputs.length + 1}`,
            kind: "audiooutput"
          });
        }
      });

      return { inputs, outputs };
    } catch (e) {
      console.warn("[Zeno Audio] Konnte Geräte nicht auflisten:", e);
      return { inputs: [], outputs: [] };
    }
  }

  /**
   * Starts local microphone capture and audio analysis
   */
  public async startMicrophone(): Promise<MediaStream | null> {
    try {
      if (this.mediaStream) {
        return this.mediaStream;
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: this.config.inputDeviceId ? { exact: this.config.inputDeviceId } : undefined,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        },
        video: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create Web Audio context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.inputGainNode = this.audioContext.createGain();
      this.inputGainNode.gain.value = this.config.inputVolume;

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.4;

      // Connect graph: Source -> Gain -> Analyser
      this.sourceNode.connect(this.inputGainNode);
      this.inputGainNode.connect(this.analyserNode);

      // Apply initial mute state
      this.applyMuteState();

      // Start VAD / RMS analysis loop
      this.startAnalysisLoop();

      console.log("[Zeno Audio] Mikrofon erfolgreich initialisiert!");
      return this.mediaStream;
    } catch (e) {
      console.error("[Zeno Audio] Fehler beim Starten des Mikrofons:", e);
      return null;
    }
  }

  /**
   * Stops microphone capture and closes audio graph
   */
  public stopMicrophone() {
    this.stopAnalysisLoop();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.inputGainNode) {
      this.inputGainNode.disconnect();
      this.inputGainNode = null;
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    if (this.testGainNode) {
      this.testGainNode.disconnect();
      this.testGainNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.currentRms = 0;
    this.setSpeakingState(false, 0);
  }

  /**
   * Real-time loop calculating Root-Mean-Square (RMS) and VAD
   */
  private startAnalysisLoop() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    const dataArray = new Uint8Array(this.analyserNode?.frequencyBinCount || 256);

    const checkLevel = () => {
      if (!this.isAnalyzing || !this.analyserNode) return;

      this.analyserNode.getByteTimeDomainData(dataArray);

      // Calculate RMS Volume
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128; // -1.0 to 1.0
        sumSquares += normalized * normalized;
      }
      const rawRms = Math.sqrt(sumSquares / dataArray.length);
      // Soft compression/amplification for UI display
      const displayRms = Math.min(Math.max(rawRms * 2.2, 0.0), 1.0);
      this.currentRms = displayRms;

      // Determine speaking state
      const now = Date.now();
      const isAboveVad = rawRms >= this.config.vadThreshold;
      let effectiveSpeaking = false;

      if (!this.isMuted && !this.isDeafened) {
        if (this.config.inputMode === "vad") {
          if (isAboveVad) {
            this.lastSpeakingTimestamp = now;
            effectiveSpeaking = true;
          } else if (now - this.lastSpeakingTimestamp < this.HANGOVER_TIME_MS) {
            effectiveSpeaking = true; // Hangover prevents clipping words
          }
        } else if (this.config.inputMode === "ptt") {
          effectiveSpeaking = this.isPttActive && isAboveVad;
        }
      }

      if (effectiveSpeaking !== this.isSpeaking) {
        this.setSpeakingState(effectiveSpeaking, displayRms);
      }

      // Notify listeners for UI meters & visualizers
      this.levelListeners.forEach((fn) => fn(displayRms, effectiveSpeaking));

      // Throttled notification to Rust backend (~120ms interval)
      if (now - this.lastRustBroadcastTime > 120) {
        this.lastRustBroadcastTime = now;
        updateVoiceSpeaking(effectiveSpeaking, displayRms);
      }

      this.animationFrameId = requestAnimationFrame(checkLevel);
    };

    this.animationFrameId = requestAnimationFrame(checkLevel);
  }

  private stopAnalysisLoop() {
    this.isAnalyzing = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private setSpeakingState(speaking: boolean, rms: number) {
    this.isSpeaking = speaking;
    this.speakingListeners.forEach((fn) => fn(speaking, rms));
  }

  /**
   * Toggles Microphone Loopback / Local Echo Test
   * Allows hearing your own voice with low latency to test microphone quality!
   */
  public async toggleMicTest(): Promise<boolean> {
    if (this.isTestingMic) {
      this.stopMicTest();
      return false;
    } else {
      await this.startMicTest();
      return true;
    }
  }

  public async startMicTest() {
    if (!this.mediaStream) {
      await this.startMicrophone();
    }
    if (!this.audioContext || !this.analyserNode) return;

    if (!this.testGainNode) {
      this.testGainNode = this.audioContext.createGain();
      this.testGainNode.gain.value = this.config.outputVolume;
      this.analyserNode.connect(this.testGainNode);
      this.testGainNode.connect(this.audioContext.destination);
    }
    this.isTestingMic = true;
    console.log("[Zeno Audio] Loopback / Echo-Test aktiv");
  }

  public stopMicTest() {
    if (this.testGainNode) {
      this.testGainNode.disconnect();
      this.testGainNode = null;
    }
    this.isTestingMic = false;
    console.log("[Zeno Audio] Loopback / Echo-Test beendet");
  }

  public getIsTestingMic(): boolean {
    return this.isTestingMic;
  }

  /**
   * Mute / Deafen controls
   */
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.applyMuteState();
  }

  public setDeafened(deafened: boolean) {
    this.isDeafened = deafened;
    this.applyMuteState();

    // Mute remote audio elements
    this.remoteAudioElements.forEach((audio) => {
      audio.muted = deafened;
    });
  }

  private applyMuteState() {
    const shouldDisableTrack = this.isMuted || this.isDeafened;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !shouldDisableTrack;
      });
    }

    if (shouldDisableTrack) {
      this.setSpeakingState(false, 0);
    }
  }

  /**
   * Push-To-Talk Keyboard handling
   */
  public setPttActive(active: boolean) {
    this.isPttActive = active;
    if (this.config.inputMode === "ptt") {
      this.applyMuteState();
    }
  }

  private setupPttGlobalListeners() {
    window.addEventListener("keydown", (e) => {
      // Default PTT Key is space or Right Alt if in PTT mode and not focused on input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.code === "Space" && this.config.inputMode === "ptt" && !this.isPttActive) {
        this.setPttActive(true);
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space" && this.config.inputMode === "ptt" && this.isPttActive) {
        this.setPttActive(false);
      }
    });
  }

  /**
   * Subscribe to live audio volume (RMS 0.0 to 1.0) for visualizers
   */
  public onAudioLevel(callback: (rms: number, isSpeaking: boolean) => void): () => void {
    this.levelListeners.add(callback);
    return () => this.levelListeners.delete(callback);
  }

  /**
   * Subscribe to speaking state transitions (true / false)
   */
  public onSpeakingChange(callback: (isSpeaking: boolean, rms: number) => void): () => void {
    this.speakingListeners.add(callback);
    return () => this.speakingListeners.delete(callback);
  }

  // Current active channel
  private activeChannelId: string | null = null;

  public getActiveChannelId(): string | null {
    return this.activeChannelId;
  }

  /**
   * Initialisiert E2EE Voice Session für einen Kanal und teilt Schlüssel
   */
  public async initChannelE2EE(channelId: string): Promise<string> {
    this.activeChannelId = channelId;
    const keyHex = await audioE2EEngine.initLocalVoiceKey();
    this.broadcastVoiceKey(channelId);
    return keyHex;
  }

  /**
   * Sendet den lokalen 256-Bit Voice-Schlüssel über die Control Plane (Relay) an alle Peers
   */
  public broadcastVoiceKey(channelId: string) {
    const keyHex = audioE2EEngine.getLocalKeyHex();
    if (keyHex) {
      sendVoiceSignal({
        channelId,
        sender: "local",
        signalType: "voice_key_share",
        data: keyHex
      });
    }
  }

  /**
   * WebRTC Peer-to-Peer Audio Channel mit Frame-by-Frame E2EE
   */
  public async createPeerConnection(peerId: string, channelId: string): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    // 1. Add local microphone audio track & WebRTC Insertable Streams Sender E2EE
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        const sender = pc.addTrack(track, this.mediaStream!);
        audioE2EEngine.setupSenderTransform(sender, channelId);
      });
    }

    // 2. Handle remote track playback & Receiver E2EE Transform
    pc.ontrack = (event) => {
      if (event.receiver) {
        audioE2EEngine.setupReceiverTransform(event.receiver, peerId, channelId);
      }

      const [remoteStream] = event.streams;
      let audio = this.remoteAudioElements.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        this.remoteAudioElements.set(peerId, audio);
      }
      audio.srcObject = remoteStream;
      audio.volume = this.config.outputVolume;
      audio.muted = this.isDeafened;
      audio.play().catch((e) => console.warn("[Zeno Audio] Remote Audio Autoplay:", e));
    };

    // 3. Send local ICE candidates to peer via Rust relay (Control Plane)
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const payload: VoiceSignalPayload = {
          channelId,
          sender: "local",
          target: peerId,
          signalType: "ice_candidate",
          data: JSON.stringify(event.candidate)
        };
        sendVoiceSignal(payload);
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  /**
   * Behandelt eingehende Control-Plane Signale (Offer, Answer, ICE, Key Share)
   */
  public async handleVoiceSignal(signal: VoiceSignalPayload): Promise<void> {
    const { channelId, sender: peerId, signalType, data } = signal;

    if (signalType === "voice_key_share") {
      await audioE2EEngine.registerPeerVoiceKey(peerId, data);
      return;
    }

    if (signalType === "offer") {
      let pc = this.peerConnections.get(peerId);
      if (!pc) {
        pc = await this.createPeerConnection(peerId, channelId);
      }
      const remoteOffer = JSON.parse(data) as RTCSessionDescriptionInit;
      await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));

      const answer = await pc.createAnswer();
      // Optimiere Opus SDP für 48kHz, FEC und VBR
      const optimizedSdp = audioE2EEngine.optimizeOpusSdp(answer.sdp || "");
      const finalAnswer = { type: answer.type, sdp: optimizedSdp };
      await pc.setLocalDescription(finalAnswer);

      sendVoiceSignal({
        channelId,
        sender: "local",
        target: peerId,
        signalType: "answer",
        data: JSON.stringify(finalAnswer)
      });
      return;
    }

    if (signalType === "answer") {
      const pc = this.peerConnections.get(peerId);
      if (pc) {
        const remoteAnswer = JSON.parse(data) as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
      }
      return;
    }

    if (signalType === "ice_candidate") {
      const pc = this.peerConnections.get(peerId);
      if (pc && data) {
        try {
          const candidate = JSON.parse(data);
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("[Zeno Audio] Fehler beim Hinzufügen von ICE Candidate:", e);
        }
      }
      return;
    }

    if (signalType === "user_left") {
      const pc = this.peerConnections.get(peerId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(peerId);
      }
      const audio = this.remoteAudioElements.get(peerId);
      if (audio) {
        audio.pause();
        audio.srcObject = null;
        this.remoteAudioElements.delete(peerId);
      }
      audioE2EEngine.removePeerVoiceKey(peerId);
    }
  }

  public getE2eeStats(): VoiceE2EEStats {
    return audioE2EEngine.getStats();
  }

  public setE2eeActive(active: boolean) {
    audioE2EEngine.setE2eeActive(active);
  }

  public setFecEnabled(enabled: boolean) {
    audioE2EEngine.setFecEnabled(enabled);
  }

  public closeAllPeers() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteAudioElements.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
    });
    this.remoteAudioElements.clear();
    this.activeChannelId = null;
  }
}

export const audioStreamService = new AudioStreamService();
