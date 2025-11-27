import React from 'react';

function WizardInstalling() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.spinner}>⏳</div>
        <h2 style={styles.heading}>Installing Plugins...</h2>
        <p style={styles.subtitle}>Please wait while we set everything up</p>

        <div style={styles.steps}>
          <div style={styles.step}>
            <span style={styles.checkmark}>✅</span>
            <span>Copying telemetry plugins</span>
          </div>
          <div style={styles.step}>
            <span style={styles.checkmark}>✅</span>
            <span>Installing to ETS2</span>
          </div>
          <div style={styles.step}>
            <span style={styles.checkmark}>✅</span>
            <span>Installing to ATS</span>
          </div>
          <div style={styles.step}>
            <span style={styles.checkmark}>✅</span>
            <span>Finalizing setup</span>
          </div>
        </div>
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
  },
  content: {
    textAlign: 'center',
    maxWidth: '600px',
  },
  spinner: {
    fontSize: '80px',
    marginBottom: '30px',
    animation: 'spin 2s linear infinite',
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
    marginBottom: '50px',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    alignItems: 'flex-start',
    margin: '0 auto',
    width: 'fit-content',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    color: '#ffffff',
  },
  checkmark: {
    color: '#10b981',
    fontSize: '20px',
  },
};

export default WizardInstalling;