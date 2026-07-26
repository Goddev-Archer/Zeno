import React from "react";

export class ZenoErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Zeno UI Rendering Exception Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#18191B", color: "#DFE1E5", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚡</div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Zeno UI-Wiederherstellung</h2>
          <p style={{ fontSize: "13px", color: "#A8AAAD", maxWidth: "480px", marginBottom: "20px" }}>
            Ein unerwarteter Darstellungsfehler wurde abgefangen. Das Layout kann im sicheren Modus sofort wiederhergestellt werden.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{ padding: "10px 20px", backgroundColor: "#3574F0", color: "#FFF", borderRadius: "6px", fontWeight: "600", cursor: "pointer", border: "none" }}
          >
            🔄 Benutzeroberfläche neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
