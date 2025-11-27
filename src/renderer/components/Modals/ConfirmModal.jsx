// src/renderer/components/Modals/ConfirmModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, XCircle, CheckCircle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // "warning", "danger", "info", "success"
  confirmButtonColor = null, // Override button color
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Icon and color based on type
  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          borderColor: "border-red-900",
          bgColor: "bg-red-900/20",
          buttonBg: confirmButtonColor || "bg-red-600 hover:bg-red-700",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
          borderColor: "border-yellow-900",
          bgColor: "bg-yellow-900/20",
          buttonBg: confirmButtonColor || "bg-yellow-600 hover:bg-yellow-700",
        };
      case "success":
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          borderColor: "border-green-900",
          bgColor: "bg-green-900/20",
          buttonBg: confirmButtonColor || "bg-green-600 hover:bg-green-700",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-12 h-12 text-purple-500" />,
          borderColor: "border-purple-900",
          bgColor: "bg-purple-900/20",
          buttonBg: confirmButtonColor || "bg-purple-600 hover:bg-purple-700",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`bg-gray-800 rounded-lg border-2 ${styles.borderColor} ${styles.bgColor} w-full max-w-md`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-4">
                {styles.icon}
                <h2 className="text-2xl font-bold text-white">{title}</h2>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Message */}
            <div className="p-6">
              <p className="text-gray-300 text-lg whitespace-pre-line">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-6 py-3 ${styles.buttonBg} text-white font-semibold rounded-lg transition-colors`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}