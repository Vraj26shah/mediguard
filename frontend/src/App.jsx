/**
 * App.jsx — MediGuard: Enterprise AI-Powered SRE Platform
 * Production-ready dashboard with ArmorClaw policy enforcement
 */

import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import IDEView from './components/IDEView';
import useSystemState from './hooks/useSystemState';
import useOpenClaw from './hooks/useOpenClaw';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState('junior_dev');
  const [isFlashing, setIsFlashing] = useState(false);
  const [auditEntries, setAuditEntries] = useState([]);

  const { services, isLoading } = useSystemState();

  const { sendCommand, isConnected } = useOpenClaw({
    role,
    onBlock: ({ command, reason }) => {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 800);

      setAuditEntries((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          role,
          command,
          decision: 'BLOCK',
          reason,
          status: 'blocked',
        },
        ...prev,
      ]);
    },
    onAllow: ({ command, tool }) => {
      setAuditEntries((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          role,
          command,
          decision: 'ALLOW',
          reason: `Tool '${tool}' executed`,
          status: 'allowed',
        },
        ...prev,
      ]);
    },
  });

  return (
    <div className={`h-screen bg-gray-950 flex flex-col ${isFlashing ? 'animate-block-flash' : ''}`}>
      {/* SINGLE GLOBAL HEADER */}
      <header className="h-20 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-850 border-b border-gray-800 flex items-center justify-between px-8">
        {/* LEFT: Logo & Branding */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-600/40 border border-blue-500/30">
              <span className="text-white font-black text-xl">M</span>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-black text-white tracking-tight">MediGuard</h1>
              <p className="text-xs text-blue-400 font-semibold">Enterprise DevOps Platform</p>
            </div>
          </div>

          <div className="h-10 w-px bg-gradient-to-b from-gray-800 to-transparent" />

          {/* CENTER: Tab Switcher */}
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2 text-sm font-bold transition-all rounded-lg ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 border border-blue-500/50'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-gray-800'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('ide')}
              className={`px-6 py-2 text-sm font-bold transition-all rounded-lg ${
                activeTab === 'ide'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 border border-blue-500/50'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-gray-800'
              }`}
            >
              Code Editor
            </button>
          </nav>
        </div>

        {/* RIGHT: Status & Controls */}
        <div className="flex items-center gap-6">
          {/* Role Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-sm font-semibold bg-gray-800 text-gray-100 border border-gray-700 rounded-lg px-4 py-2 hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              <option value="junior_dev">Junior Developer</option>
              <option value="senior_dev">Senior Developer</option>
              <option value="project_manager">Project Manager</option>
            </select>
          </div>

          <div className="h-10 w-px bg-gradient-to-b from-gray-800 to-transparent" />

          {/* Connection Status */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1.5 text-right">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">System Status</p>
              <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1.5 border border-gray-700">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs font-mono text-gray-300 font-semibold">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' ? (
          <Dashboard
            role={role}
            services={services}
            isLoading={isLoading}
            auditEntries={auditEntries}
            sendCommand={sendCommand}
            isConnected={isConnected}
          />
        ) : (
          <IDEView
            role={role}
            onRoleChange={setRole}
            sendCommand={sendCommand}
            isConnected={isConnected}
          />
        )}
      </main>
    </div>
  );
}
