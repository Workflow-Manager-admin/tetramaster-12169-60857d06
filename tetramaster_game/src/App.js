import React from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="app">
      <nav className="navbar glass-panel">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
          <div className="logo">
            <span className="logo-symbol">■</span>
            TetraMaster
          </div>
          <div>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              By KAVIA AI
            </span>
          </div>
        </div>
      </nav>
      <main style={{ marginTop: "80px" }}>
        {/* Margin ensures the main content sits just below the navbar */}
        <TetraMaster />
      </main>
    </div>
  );
}

export default App;
