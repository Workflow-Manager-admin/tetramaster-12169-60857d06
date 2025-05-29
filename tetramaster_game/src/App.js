import React from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="app" style={{ minHeight: "100vh", background: "#222831" }}>
      <nav className="navbar">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
          <div className="logo" style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fff", letterSpacing: "0.03em", paddingLeft: 0 }}>
            <span className="logo-symbol" style={{ color: "#E87A41", fontWeight: 900, letterSpacing: "0.06em" }}>■</span>
            TetraMaster
          </div>
          <div>
            <span style={{ fontSize: '1rem', color: '#fff', opacity: 0.6 }}>
              By KAVIA AI
            </span>
          </div>
        </div>
      </nav>
      <main style={{ marginTop: "72px" }}>
        {/* Margin ensures the main content sits just below the navbar */}
        <TetraMaster />
      </main>
    </div>
  );
}

export default App;
