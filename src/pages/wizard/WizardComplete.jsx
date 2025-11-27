import React from 'react';

function WizardComplete({ onContinue }) {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.successIcon}>🎉</div>
        
        <h2 style={styles.heading}>You're Good to Go!</h2>
        <p style={styles.subtitle}>
          Enigma Hub is ready to track your driving
        </p>

        <div style={styles.infoBox}>
          <h3 style={styles.infoHeading}>What's Next:</h3>
          <div style={styles.stepsList}>
            <div style={styles.step}>
              <span style={styles.stepNumber}>1</span>
              <span style={styles.stepText}>Sign in or create an account</span>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>2</span>
              <span style={styles.stepText}>Launch ETS2 or ATS</span>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>3</span>
              <span style={styles.stepText}>Start driving and see real-time stats!</span>
            </div>
          </div>
        </div>

        <div style={styles.hotkeysBox}>
          <h4 style={styles.hotkeysHeading}>📋 Useful Hotkeys:</h4>
          <div style={styles.hotkeyGrid}>
            <div style={styles.hotkey}>
              <span style={styles.hotkeyCombo}>ALT + O</span>
              <span style={styles.hotkeyDesc}>Open settings</span>
            </div>
            <div style={styles.hotkey}>
              <span style={styles.hotkeyCombo}>ALT + D</span>
              <span style={styles.hotkeyDesc}>Toggle dispatcher</span>
            </div>
          </div>
        </div>

        <button onClick={onContinue} style={styles.button}>
          Continue to Login
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
    maxWidth: '700px',
    padding: '40px',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '100px',
    marginBottom: '30px',
  },
  heading: {
    fontSize: '48px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #a855f7 0%, #fbbf24 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#8b8b9e',
    marginBottom: '40px',
  },
  infoBox: {
    background: 'rgba(168, 85, 247, 0.1)',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    borderRadius: '16px',
    padding: '30px',
    marginBottom: '30px',
    textAlign: 'left',
  },
  infoHeading: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '20px',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  stepNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #a855f7 0%, #fbbf24 100%)',
    color: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px',
    flexShrink: 0,
  },
  stepText: {
    fontSize: '16px',
    color: '#ffffff',
  },
  hotkeysBox: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    textAlign: 'left',
  },
  hotkeysHeading: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '15px',
  },
  hotkeyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  hotkey: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  hotkeyCombo: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
  },
  hotkeyDesc: {
    fontSize: '13px',
    color: '#8b8b9e',
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
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
};

export default WizardComplete;