import { useState, useEffect } from 'react';
import { Lock, Upload, RefreshCw, AlertTriangle, Trash2, GitBranch } from 'lucide-react';

export default function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');

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
    setStatus('🔨 Building and publishing...');

    try {
      const result = await window.electronAPI?.pushRelease?.({ version, releaseNotes });
      if (result.success) {
        setStatus(`✅ Release v${version} published!`);
        setVersion('');
        setReleaseNotes('');
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

  if (!import.meta.env.DEV) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl shadow-2xl p-6 w-[600px] border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold">Developer Panel</h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleQuickPush}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <GitBranch size={18} />
            Quick Push
          </button>
          <button
            onClick={handleUninstall}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Uninstall
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.2"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Release Notes</label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="What's new?"
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {status && (
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-sm">
              {status}
            </div>
          )}

          <button
            onClick={handlePushRelease}
            disabled={isUploading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Building...
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
            <p>Quick Push: git commit & push. Build & Release: creates GitHub release with auto-update.</p>
          </div>
        </div>
      </div>
    </div>
  );
}