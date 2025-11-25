import React, { useState } from 'react';
import WizardWelcome from './WizardWelcome';
import WizardGamePaths from './WizardGamePaths';
import WizardInstalling from './WizardInstalling';
import WizardComplete from './WizardComplete';

function FirstRunWizard({ onComplete }) {
  const [step, setStep] = useState('welcome'); // welcome, paths, installing, complete
  const [gamePaths, setGamePaths] = useState({ ets2: null, ats: null });

  const handleWelcomeNext = () => {
    setStep('paths');
  };

  const handlePathsSubmit = async (ets2Path, atsPath) => {
    setGamePaths({ ets2: ets2Path, ats: atsPath });
    setStep('installing');

    // Save paths and install plugins
    const result = await window.electronAPI.saveGamePaths(ets2Path, atsPath);

    if (result.success) {
      // Wait a moment to show the installing screen
      setTimeout(() => {
        setStep('complete');
      }, 2000);
    } else {
      alert('Failed to save game paths: ' + result.error);
      setStep('paths');
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {step === 'welcome' && <WizardWelcome onNext={handleWelcomeNext} />}
      {step === 'paths' && <WizardGamePaths onSubmit={handlePathsSubmit} />}
      {step === 'installing' && <WizardInstalling />}
      {step === 'complete' && <WizardComplete onContinue={handleComplete} />}
    </div>
  );
}

export default FirstRunWizard;