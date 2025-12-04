// src/renderer/components/UpdateNotification.jsx
import React, { useState, useEffect } from "react";

const api = window.electronAPI;

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    if (!api || !api.onUpdateNotification) {
      console.log('[UpdateNotification] ⚠️ electronAPI not available');
      return;
    }

    console.log('[UpdateNotification] ✅ Setting up simplified update listener');

    // Single listener that receives all update events
    api.onUpdateNotification((data) => {
      console.log('[UpdateNotification] 📥 Received update notification:', data);
      setUpdateInfo(data);
    });
  }, []);

  const onRestart = () => {
    if (api && api.installUpdate) {
      api.installUpdate();
    }
  };

  const onDismiss = () => {
    setUpdateInfo(null);
  };

  if (!updateInfo) return null;

  const { status, version, progress = 0 } = updateInfo;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm rounded-xl bg-[#141022] border border-purple-500/40 shadow-lg p-4 text-sm text-gray-100">
      {status === "available" && (
        <>
          <div className="font-semibold text-purple-300 mb-1">
            Update available · v{version}
          </div>
          <div className="text-xs text-gray-400 mb-3">
            A new version of Enigma Hub is ready to download.
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-700/70 hover:bg-gray-600 transition"
              onClick={onDismiss}
            >
              Later
            </button>
            <button
              className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 transition font-semibold"
              onClick={onDismiss}
            >
              Downloading...
            </button>
          </div>
        </>
      )}

      {status === "downloading" && (
        <>
          <div className="font-semibold text-purple-300 mb-1">
            Downloading v{version}…
          </div>
          <div className="w-full bg-gray-800/70 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-purple-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>{Math.round(progress)}%</span>
            <span>Downloading update…</span>
          </div>
        </>
      )}

      {status === "ready" && (
        <>
          <div className="font-semibold text-green-400 mb-1">
            Update ready · v{version}
          </div>
          <div className="text-xs text-gray-400 mb-3">
            The update has been downloaded. Restart Enigma Hub to finish
            installing.
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-700/70 hover:bg-gray-600 transition"
              onClick={onDismiss}
            >
              Later
            </button>
            <button
              className="px-3 py-1.5 text-xs rounded-lg bg-green-500 hover:bg-green-400 transition font-semibold"
              onClick={onRestart}
            >
              Restart & Install Now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
