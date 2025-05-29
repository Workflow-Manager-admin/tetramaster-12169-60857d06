import React from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="app" style={{ minHeight: "100vh", background: "#222831" }}>
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
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
