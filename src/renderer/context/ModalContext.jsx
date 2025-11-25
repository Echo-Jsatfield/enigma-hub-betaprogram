// src/renderer/context/ModalContext.jsx
import React, { createContext, useContext, useState } from "react";
import ConfirmModal from "../components/Modals/ConfirmModal";
import AlertModal from "../components/Modals/AlertModal";

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "warning",
  });

  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    buttonText: "OK",
  });

  /**
   * Show a confirm dialog
   * @param {Object} options - Configuration options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Dialog message
   * @param {string} options.confirmText - Confirm button text (default: "Confirm")
   * @param {string} options.cancelText - Cancel button text (default: "Cancel")
   * @param {string} options.type - Dialog type: "info", "warning", "danger", "success"
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if canceled
   */
  const confirm = ({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning",
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  };

  /**
   * Show an alert dialog
   * @param {Object} options - Configuration options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Dialog message
   * @param {string} options.type - Dialog type: "info", "success", "warning", "error"
   * @param {string} options.buttonText - Button text (default: "OK")
   * @returns {Promise<void>}
   */
  const alert = ({
    title,
    message,
    type = "info",
    buttonText = "OK",
  }) => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        buttonText,
        onClose: () => {
          resolve();
        },
      });
    });
  };

  const closeConfirm = () => {
    if (confirmState.onCancel) {
      confirmState.onCancel();
    }
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const closeAlert = () => {
    if (alertState.onClose) {
      alertState.onClose();
    }
    setAlertState({ ...alertState, isOpen: false });
  };

  const value = {
    confirm,
    alert,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttonText={alertState.buttonText}
      />
    </ModalContext.Provider>
  );
};