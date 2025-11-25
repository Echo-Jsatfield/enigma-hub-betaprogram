import { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, Download } from 'lucide-react';

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    const unsubscribeAvailable = window.electronAPI?.onUpdateAvailable?.((info) => {
      setUpdateInfo(info);
      setIsDownloading(true);  // Auto-download starts
      setIsDownloaded(false);
    });

    const unsubscribeProgress = window.electronAPI?.onDownloadProgress?.((progress) => {
      setDownloadProgress(progress.percent);
    });

    const unsubscribeDownloaded = window.electronAPI?.onUpdateDownloaded?.((info) => {
      setIsDownloaded(true);
      setIsDownloading(false);
      setUpdateInfo(prev => ({ ...prev, ...info }));
    });

    return () => {
      window.electronAPI?.removeUpdateListeners?.();
    };
  }, []);

  const handleInstall = () => {
    window.electronAPI?.installUpdate?.();
  };

  const handleDismiss = () => {
    setUpdateInfo(null);
  };

  if (!updateInfo) return null;

  return (
    <div className="fixed top-4 right-4 w-96 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-2xl p-5 z-50 animate-slide-in">
      {!isDownloaded && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      )}

      {!isDownloaded ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-lg">
              {isDownloading ? (
                <Download className="animate-bounce" size={24} />
              ) : (
                <RefreshCw size={24} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">Update Available!</h3>
              <p className="text-sm text-white/90">Version {updateInfo.version}</p>
            </div>
          </div>

          {updateInfo.releaseNotes && (
            <p className="text-sm text-white/80 mb-4 line-clamp-2">
              {updateInfo.releaseNotes}
            </p>
          )}

          <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-sm text-white/90 text-center">
            Downloading... {Math.round(downloadProgress)}%
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-400/30 p-2 rounded-lg">
              <CheckCircle size={24} className="text-green-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Update Ready!</h3>
              <p className="text-sm text-white/90">v{updateInfo.version} downloaded</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-4">
            Game plugins will be updated automatically. Just restart the app!
          </p>
          <button
            onClick={handleInstall}
            className="w-full bg-white text-purple-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Restart & Install Now
          </button>
        </>
      )}
    </div>
  );
}