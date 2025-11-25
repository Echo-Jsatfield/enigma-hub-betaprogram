import React, { useState, useEffect } from 'react';

function WizardGamePaths({ onSubmit }) {
  const [ets2Path, setEts2Path] = useState('');
  const [atsPath, setAtsPath] = useState('');
  const [ets2Valid, setEts2Valid] = useState(false);
  const [atsValid, setAtsValid] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    // Auto-detect on mount
    autoDetect();
  }, []);

  const autoDetect = async () => {
    setDetecting(true);
    const detected = await window.electronAPI.autoDetectGames();
    
    if (detected.ets2) {
      setEts2Path(detected.ets2);
      setEts2Valid(true);
    }
    
    if (detected.ats) {
      setAtsPath(detected.ats);
      setAtsValid(true);
    }
    
    setDetecting(false);
  };

  const handleBrowseEts2 = async () => {
    const path = await window.electronAPI.browseFolder(
      'Select Euro Truck Simulator 2 Folder',
      'C:\\Program Files (x86)\\Steam\\steamapps\\common'
    );
    
    if (path) {
      setEts2Path(path);
      const valid = await window.electronAPI.validateGamePath(path, 'ets2');
      setEts2Valid(valid);
    }
  };

  const handleBrowseAts = async () => {
    const path = await window.electronAPI.browseFolder(
      'Select American Truck Simulator Folder',
      'C:\\Program Files (x86)\\Steam\\steamapps\\common'
    );
    
    if (path) {
      setAtsPath(path);
      const valid = await window.electronAPI.validateGamePath(path, 'ats');
      setAtsValid(valid);
    }
  };

  const handleSubmit = () => {
    if (ets2Valid && atsValid) {
      onSubmit(ets2Path, atsPath);
    }
  };

  const canSubmit = ets2Valid && atsValid;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.icon}>🎮</div>
          <h2 style={styles.heading}>Configure Game Paths</h2>
          <p style={styles.subtitle}>
            {detecting ? 'Auto-detecting games...' : 'Select your ETS2 and ATS installation folders'}
          </p>
        </div>

        {/* ETS2 */}
        <div style={styles.gameSection}>
          <div style={styles.gameHeader}>
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🚛%3C/text%3E%3C/svg%3E" 
              alt="ETS2"
              style={styles.gameLogo}
            />
            <div>
              <div style={styles.gameTitle}>Euro Truck Simulator 2</div>
              <div style={styles.gameSubtitle}>Select installation folder</div>
            </div>
          </div>
          
          <div style={styles.pathInput}>
            <input
              type="text"
              value={ets2Path}
              readOnly
              placeholder="No path selected"
              style={{
                ...styles.input,
                borderColor: ets2Path ? (ets2Valid ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)') : 'rgba(168, 85, 247, 0.3)'
              }}
            />
            <button onClick={handleBrowseEts2} style={styles.browseBtn}>
              Browse
            </button>
          </div>
          
          {ets2Path && !ets2Valid && (
            <div style={styles.error}>❌ Invalid ETS2 installation folder</div>
          )}
          {ets2Valid && (
            <div style={styles.success}>✅ Valid ETS2 installation</div>
          )}
        </div>

        {/* ATS */}
        <div style={styles.gameSection}>
          <div style={styles.gameHeader}>
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🚚%3C/text%3E%3C/svg%3E" 
              alt="ATS"
              style={styles.gameLogo}
            />
            <div>
              <div style={styles.gameTitle}>American Truck Simulator</div>
              <div style={styles.gameSubtitle}>Select installation folder</div>
            </div>
          </div>
          
          <div style={styles.pathInput}>
            <input
              type="text"
              value={atsPath}
              readOnly
              placeholder="No path selected"
              style={{
                ...styles.input,
                borderColor: atsPath ? (atsValid ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)') : 'rgba(168, 85, 247, 0.3)'
              }}
            />
            <button onClick={handleBrowseAts} style={styles.browseBtn}>
              Browse
            </button>
          </div>
          
          {atsPath && !atsValid && (
            <div style={styles.error}>❌ Invalid ATS installation folder</div>
          )}
          {atsValid && (
            <div style={styles.success}>✅ Valid ATS installation</div>
          )}
        </div>

        <div style={styles.infoBox}>
          <div style={styles.infoIcon}>ℹ️</div>
          <div style={styles.infoText}>
            <strong>What happens next:</strong>
            <br />
            Enigma Hub will install telemetry plugins to both game folders. These plugins allow real-time tracking of your driving.
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={!canSubmit}
          style={{
            ...styles.button,
            opacity: canSubmit ? 1 : 0.5,
            cursor: canSubmit ? 'pointer' : 'not-allowed'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto',
  },
  content: {
    width: '100%',
    maxWidth: '800px',
    padding: '40px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  icon: {
    fontSize: '60px',
    marginBottom: '20px',
  },
  heading: {
    fontSize: '36px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#8b8b9e',
  },
  gameSection: {
    background: 'rgba(168, 85, 247, 0.1)',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  gameHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px',
  },
  gameLogo: {
    width: '48px',
    height: '48px',
  },
  gameTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
  },
  gameSubtitle: {
    fontSize: '14px',
    color: '#8b8b9e',
  },
  pathInput: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  input: {
    flex: 1,
    background: '#16162a',
    border: '1px solid',
    borderRadius: '8px',
    padding: '12px 15px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  browseBtn: {
    background: 'rgba(168, 85, 247, 0.2)',
    border: '1px solid rgba(168, 85, 247, 0.5)',
    borderRadius: '8px',
    padding: '12px 25px',
    color: '#a855f7',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
  },
  success: {
    color: '#10b981',
    fontSize: '14px',
  },
  infoBox: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
  },
  infoIcon: {
    fontSize: '24px',
  },
  infoText: {
    fontSize: '14px',
    color: '#ffffff',
    lineHeight: '1.6',
  },
  button: {
    width: '100%',
    background: 'linear-gradient(135deg, #a855f7 0%, #fbbf24 100%)',
    border: 'none',
    color: '#000000',
    fontSize: '18px',
    fontWeight: '600',
    padding: '16px',
    borderRadius: '12px',
    transition: 'transform 0.2s',
  },
};

export default WizardGamePaths;