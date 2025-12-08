// src/components/Layout/MainLayout.jsx
import React, { useState } from "react";
import TitleBar from "../Common/TitleBar";
import Sidebar from "../Common/Sidebar";

export default function MainLayout({ children, currentPage, setCurrentPage }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell h-screen w-screen flex flex-col overflow-hidden bg-[#0b0c1a] text-gray-200">
      {/* Title Bar - Show logo only when sidebar is collapsed */}
      <TitleBar showLogo={collapsed} />

      {/* Layout container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Shows logo when expanded */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />

        {/* Main Content */}
        <main className="app-main flex-1 overflow-y-auto relative bg-[#0b0c1a]">
          {children}
        </main>
      </div>
    </div>
  );
}
