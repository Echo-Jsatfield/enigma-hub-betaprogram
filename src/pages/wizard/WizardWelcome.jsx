import React from 'react';

function WizardWelcome({ onNext }) {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🚛</div>
          <h1 style={styles.heading}>Welcome to Enigma Hub!</h1>
          <p style={styles.tagline}>The Ultimate VTC Management Platform</p>
        </div>

        <div style={styles.infoBox}>
          <h3 style={styles.infoHeading}>What you'll get:</h3>
          <div style={styles.featureGrid}>
            <div style={styles.feature}>
              <span style={styles.icon}>📊</span>
              <div>
                <div style={styles.featureTitle}>Real-time Telemetry</div>
                <div style={styles.featureDesc}>Track your driving in real-time</div>
              </div>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>🎯</span>
              <div>
                <div style={styles.featureTitle}>Job Management</div>
                <div style={styles.featureDesc}>Organize your deliveries</div>
              </div>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>👥</span>
              <div>
                <div style={styles.featureTitle}>VTC Hub</div>
                <div style={styles.featureDesc}>Connect with your company</div>
              </div>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>🏆</span>
              <div>
                <div style={styles.featureTitle}>Leaderboards</div>
                <div style={styles.featureDesc}>Compete with drivers</div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={onNext} style={styles.button}>
          Get Started →
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
  },
  content: {
    width: '100%',
    maxWidth: '700px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '50px',
  },
  logo: {
    fontSize: '80px',
    marginBottom: '20px',
  },
  heading: {
    fontSize: '48px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #a855f7 0%, #fbbf24 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '10px',
  },
  tagline: {
    fontSize: '18px',
    color: '#8b8b9e',
  },
  infoBox: {
    width: '100%',
    background: 'rgba(168, 85, 247, 0.1)',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    borderRadius: '16px',
    padding: '30px',
    marginBottom: '40px',
  },
  infoHeading: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '25px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  feature: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
  },
  icon: {
    fontSize: '32px',
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#8b8b9e',
  },
  button: {
    background: 'linear-gradient(135deg, #a855f7 0%, #fbbf24 100%)',
    border: 'none',
    color: '#000000',
    fontSize: '18px',
    fontWeight: '600',
    padding: '16px 80px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
};

export default WizardWelcome;