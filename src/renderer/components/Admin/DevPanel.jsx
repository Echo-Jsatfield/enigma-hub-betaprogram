import { useState, useEffect } from 'react';
import { Lock, Upload, RefreshCw, AlertTriangle, Trash2, GitBranch, Download, CheckCircle, XCircle } from 'lucide-react';

export default function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');

  // Manual Update Checker State
  const [currentVersion, setCurrentVersion] = useState('');
  const [availableVersions, setAvailableVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        if (import.meta.env.DEV) {
          setIsOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Get current version on mount
  useEffect(() => {
    if (isOpen) {
      fetchCurrentVersion();
      fetchAvailableVersions();
    }
  }, [isOpen]);

  // Listen for update events
  useEffect(() => {
    const handleUpdateAvailable = (event, info) => {
      setUpdateInfo(info);
      setStatus('✅ Update available: v' + info.version);
    };

    const handleDownloadProgress = (event, progress) => {
      setDownloadProgress(Math.round(progress.percent));
    };

    const handleUpdateDownloaded = (event, info) => {
      setStatus('✅ Update downloaded! Ready to install v' + info.version);
      setIsDownloading(false);
    };

    if (window.electronAPI?.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
    }
    if (window.electronAPI?.onDownloadProgress) {
      window.electronAPI.onDownloadProgress(handleDownloadProgress);
    }
    if (window.electronAPI?.onUpdateDownloaded) {
      window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);
    }

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const fetchCurrentVersion = async () => {
    try {
      const ver = await window.electronAPI?.getAppVersion?.();
      setCurrentVersion(ver || '1.0.5');
    } catch (error) {
      console.error('Failed to get version:', error);
      setCurrentVersion('1.0.5');
    }
  };

  const fetchAvailableVersions = async () => {
    try {
      setIsChecking(true);
      const response = await fetch('https://api.github.com/repos/Echo-Jsatfield/enigma-hub-betaprogram/releases');
      const releases = await response.json();
      
      const versions = releases
        .filter(r => !r.draft && !r.prerelease)
        .map(r => ({
          version: r.tag_name.replace(/^v/, ''),
          name: r.name || r.tag_name,
          notes: r.body || 'No release notes provided',
          downloadUrl: r.assets.find(a => a.name.endsWith('.exe'))?.browser_download_url,
          publishedAt: r.published_at
        }))
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      setAvailableVersions(versions);
      if (versions.length > 0) {
        setSelectedVersion(versions[0].version);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      setStatus('❌ Failed to fetch available versions');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    setStatus('🔍 Checking for updates...');
    
    try {
      const result = await window.electronAPI?.checkForUpdates?.();
      if (result?.success) {
        if (result.updateInfo) {
          setStatus(`✅ Update available: v${result.updateInfo.version}`);
        } else {
          setStatus('✅ You are on the latest version');
        }
      }
      await fetchAvailableVersions();
    } catch (error) {
      setStatus('❌ Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateInfo) {
      // Manual install from selected version
      const selected = availableVersions.find(v => v.version === selectedVersion);
      if (!selected?.downloadUrl) {
        setStatus('❌ No download URL found for this version');
        return;
      }

      setIsDownloading(true);
      setStatus('📥 Downloading update...');
      setDownloadProgress(0);

      try {
        // Trigger download via electron
        const result = await window.electronAPI?.downloadUpdate?.({
          downloadUrl: selected.downloadUrl,
          version: selected.version
        });

        if (result?.success) {
          // Apply update
          const applyResult = await window.electronAPI?.applyUpdate?.({ exePath: result.path });
          if (applyResult?.success) {
            setStatus('✅ Update will be applied on restart');
          } else {
            setStatus('❌ ' + (applyResult?.error || 'Failed to apply update'));
          }
        }
      } catch (error) {
        setStatus('❌ ' + error.message);
      } finally {
        setIsDownloading(false);
      }
    } else {
      // Install already downloaded update
      window.electronAPI?.installUpdate?.();
    }
  };

  const handleQuickPush = async () => {
    setIsUploading(true);
    setStatus('📤 Pushing to GitHub...');

    try {
      const result = await window.electronAPI?.quickPush?.();
      if (result.success) {
        setStatus(`✅ ${result.message}`);
      } else {
        setStatus(`❌ ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePushRelease = async () => {
    if (!version || !releaseNotes) {
      setStatus('❌ Version and release notes required!');
      return;
    }

    setIsUploading(true);
    setStatus('📦 Building and publishing release...');

    try {
      const result = await window.electronAPI?.pushRelease?.({ version, releaseNotes });
      if (result.success) {
        setStatus(`✅ Release v${version} published and live!`);
        setVersion('');
        setReleaseNotes('');
        // Refresh available versions
        await fetchAvailableVersions();
      } else {
        setStatus(`❌ ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUninstall = async () => {
    if (!confirm('Delete ALL app data and plugins?')) return;

    try {
      const result = await window.electronAPI?.uninstallApp?.();
      if (result.success) {
        alert('Uninstalled! App will close.');
        window.close();
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const selectedRelease = availableVersions.find(v => v.version === selectedVersion);
  const isNewerVersion = selectedVersion && currentVersion && selectedVersion > currentVersion;

  if (!import.meta.env.DEV) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl border border-purple-500/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lock className="text-purple-400" size={28} />
            <div>
              <h2 className="text-2xl font-bold">Developer Panel</h2>
              <p className="text-sm text-gray-400">Current: v{currentVersion}</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - Release Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-400 border-b border-purple-500/30 pb-2">
              📦 Release Management
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleQuickPush}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <GitBranch size={18} />
                Quick Push
              </button>
              <button
                onClick={handleUninstall}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Trash2 size={18} />
                Uninstall
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Version Number</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.6"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Release Notes</label>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="- Fixed overlay crash&#10;- Added new features&#10;- Performance improvements"
                rows={6}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none font-mono text-sm"
              />
            </div>

            <button
              onClick={handlePushRelease}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Building & Publishing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Build & Release
                </>
              )}
            </button>

            <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <p>Quick Push commits & pushes code. Build & Release creates a GitHub release with auto-updater support.</p>
            </div>
          </div>

          {/* RIGHT COLUMN - Update Manager */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-400 border-b border-green-500/30 pb-2">
              🔄 Update Manager
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">Available Versions</label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                disabled={isChecking || availableVersions.length === 0}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50"
              >
                {availableVersions.length === 0 ? (
                  <option>No versions available</option>
                ) : (
                  availableVersions.map(v => (
                    <option key={v.version} value={v.version}>
                      v{v.version} {v.version === currentVersion ? '(current)' : ''}
                      {v.version > currentVersion ? ' 🆕' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedRelease && (
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-300">
                    {selectedRelease.name}
                  </span>
                  {isNewerVersion && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      Newer
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {selectedRelease.notes}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCheckForUpdates}
                disabled={isChecking || isDownloading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Check Updates
                  </>
                )}
              </button>

              <button
                onClick={handleInstallUpdate}
                disabled={!selectedRelease?.downloadUrl || isDownloading || selectedVersion === currentVersion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isDownloading ? (
                  <>
                    <Download className="animate-bounce" size={18} />
                    {downloadProgress}%
                  </>
                ) : updateInfo ? (
                  <>
                    <CheckCircle size={18} />
                    Install Now
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download
                  </>
                )}
              </button>
            </div>

            {isDownloading && (
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            )}

            <div className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <p>Manual updater lets you choose specific versions. Auto-updater runs in background every 2 hours.</p>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        {status && (
          <div className="mt-6 bg-gray-700/70 border border-gray-600 rounded-lg p-4 text-sm font-mono">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}