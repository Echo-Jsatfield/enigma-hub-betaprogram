// src/renderer/App.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { ModalProvider } from './context/ModalContext';
import { useHolidayMode } from "../hooks/useHolidayMode";
import AuthLayout from "./components/Layout/AuthLayout";
import RegisterLayout from "./components/Layout/RegisterLayout";
import MainLayout from "./components/Layout/MainLayout";

// Import wizard
import FirstRunWizard from "../pages/wizard/FirstRunWizard";

// Import update components
import DevPanel from "./components/Admin/DevPanel";
import UpdateNotification from "./components/Common/UpdateNotification";

// Import all pages
import Dashboard from "./components/Dashboard/Dashboard";
import PendingApprovals from "./components/Admin/PendingApprovals";
import UserManagement from "./components/Admin/UserManagement";
import Jobs from "./components/Jobs/Jobs";
import MyJobs from "./components/Jobs/MyJobs";
import CompanyJobs from "./components/Jobs/CompanyJobs";
import Profile from "./components/Profile/Profile";
import Settings from "./components/Settings/Settings";
import DownloadsPage from "../pages/DownloadsPage";
import SystemLogs from "./components/Admin/SystemLogs";
import DriverReset from "./components/Admin/DriverReset";
import JobManager from "./components/Admin/JobManager";
import UserRoles from "./components/Admin/UserRoles";

export default function App() {
  const { user, authMode, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isFirstRun, setIsFirstRun] = useState(null); // null = checking, true/false = result
  const [wizardComplete, setWizardComplete] = useState(false);
  const { toggleHolidayMode } = useHolidayMode();

  // Check for first run on mount
  useEffect(() => {
    checkFirstRun();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key && e.key.toUpperCase() === "C") {
        toggleHolidayMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleHolidayMode]);

  const checkFirstRun = async () => {
    if (window.electronAPI?.checkFirstRun) {
      const firstRun = await window.electronAPI.checkFirstRun();
      console.log('[App] First run check:', firstRun);
      setIsFirstRun(firstRun);
    } else {
      // Not in Electron or API not available
      setIsFirstRun(false);
    }
  };

  const handleWizardComplete = () => {
    console.log('[App] Wizard completed!');
    setWizardComplete(true);
    setIsFirstRun(false);
  };

  // Show loading while checking first run
  if (isFirstRun === null || loading) {
    return (
      <div className="h-screen w-screen bg-[#0b0c1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#f8cc00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Enigma Hub...</p>
        </div>
      </div>
    );
  }

  // Show wizard if first run and not completed
  if (isFirstRun && !wizardComplete) {
    return <FirstRunWizard onComplete={handleWizardComplete} />;
  }

  // Show auth screens if not logged in
  if (!user) {
    return authMode === "login" ? <AuthLayout /> : <RegisterLayout />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "pending-approvals":
        return <PendingApprovals />;
      case "user-management":
        return <UserManagement />;
      case "user-roles":
        return <UserRoles />;
      case "driver-reset":
        return <DriverReset />;
      case "job-manager":
        return <JobManager />;
      case "jobs":
        return <Jobs />;
      case "my-jobs":
        return <MyJobs />;
      case "company-jobs":
        return <CompanyJobs />;
      case "profile":
        return <Profile />;
      case "downloads":
        return <DownloadsPage />;
      case "settings":
        return <Settings />;
      case "system-logs":
        return <SystemLogs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ModalProvider>
      <DevPanel />  {/* Hidden dev panel - Ctrl+Shift+D */}
      <UpdateNotification />  {/* Auto-update notification */}
      <MainLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {renderPage()}
      </MainLayout>
    </ModalProvider>
  );
}
