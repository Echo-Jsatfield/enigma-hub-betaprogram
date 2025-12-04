// src/renderer/components/UpdateNotification.jsx
import React, { useEffect, useState } from "react";

const api = window.electronAPI;

export default function UpdateNotification() {
  const [status, setStatus] = useState("idle"); // idle | available | downloading | ready
  const [version, setVersion] = useState(null);
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState(0);

  // DEBUG: Test if component renders
  console.log('[UpdateNotification] Component rendered, status:', status);

  useEffect(() => {
    if (!api) {
      console.log('[UpdateNotification] ⚠️ electronAPI not available');
      return;
    }

    console.log('[UpdateNotification] Setting up event listeners');

    // Check if there's already a downloaded update waiting
    (async () => {
      const existingUpdate = await api.getUpdateStatus();
      if (existingUpdate) {
        console.log('[UpdateNotification] ✅ Found existing update:', existingUpdate);
        setVersion(existingUpdate.version);
        setNotes(existingUpdate.releaseNotes || "");
        setStatus("ready");
        setProgress(100);
      }
    })();

    // electron-updater events (NOT custom)
    const unsubscribeAvailable = api.onUpdateAvailable((payload) => {
      console.log('[UpdateNotification] 📥 Received update-available:', payload);
      setVersion(payload.version);
      setNotes(payload.releaseNotes || "");
      setStatus("available");
      setProgress(0);
    });

    const unsubscribeProgress = api.onDownloadProgress((payload) => {
      console.log('[UpdateNotification] 📊 Received download-progress:', payload.percent);
      setProgress(payload.percent || 0);
      if (status === "idle") setStatus("downloading");
    });

    const unsubscribeDownloaded = api.onUpdateDownloaded((payload) => {
      console.log('[UpdateNotification] ✅ Received update-downloaded:', payload);
      setStatus("ready");
      setProgress(100);
    });

    return () => {
      console.log('[UpdateNotification] Cleaning up event listeners');
      unsubscribeAvailable && unsubscribeAvailable();
      unsubscribeProgress && unsubscribeProgress();
      unsubscribeDownloaded && unsubscribeDownloaded();
    };
  }, [status]);

  const onRestart = async () => {
    if (!api) return;
    api.installUpdate();
  };

  if (status === "idle") return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm rounded-xl bg-[#141022] border border-purple-500/40 shadow-lg p-4 text-sm text-gray-100">
      {status === "available" && (
        <>
          <div className="font-semibold text-purple-300 mb-1">
            Update available · v{version}
          </div>
          <div className="text-xs text-gray-400 mb-3 line-clamp-3">
            {notes || "A new version of Enigma Hub is ready to download."}
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-700/70 hover:bg-gray-600 transition"
              onClick={() => setStatus("idle")}
            >
              Later
            </button>
            <button
              className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 transition font-semibold"
              onClick={() => setStatus("downloading")}
            >
              Download
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
              onClick={() => setStatus("idle")}
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