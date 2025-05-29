import React from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

function App() {
  return (
    <div className="app" style={{ minHeight: "100vh", background: "#222831" }}>
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol" style={{ color: '#00adb5' }}>*</span> TetraMaster
            </div>
            <span style={{ fontSize: '1rem', color: '#fff', opacity: 0.6 }}>
              By KAVIA AI
            </span>
          </div>
        </div>
      </nav>
      <main>
        <TetraMaster />
      </main>
    </div>
  );
}

export default App;