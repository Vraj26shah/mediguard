/**
 * App.jsx — Root layout for MediGuard dashboard
 *
 * Split into 3 columns:
 *   LEFT   → ServiceCards (infra map — shows live status of 3 services)
 *   CENTER → ChatPanel   (NL command input + role selector)
 *   RIGHT  → AuditLog    (ALLOW / BLOCK history from ArmorClaw)
 *
 * The `blockFlash` state is lifted here so ANY blocked action can
 * flash the entire screen red regardless of which component triggers it.
 */

import React, { useState } from 'react';
import ServiceCard from './components/ServiceCard';
import ChatPanel from './components/ChatPanel';
import AuditLog from './components/AuditLog';
import useSystemState from './hooks/useSystemState';
import useOpenClaw from './hooks/useOpenClaw';

export default function App() {
  // Current active role — passed to OpenClaw as metadata on every message
  // Roles: 'junior_dev' | 'senior_dev' | 'project_manager'
  const [role, setRole] = useState('junior_dev');

  // Whether to show the red screen flash (fires on BLOCK events from ArmorClaw)
  const [isFlashing, setIsFlashing] = useState(false);

  // Audit log entries — each entry: { id, timestamp, role, command, decision, reason }
  const [auditEntries, setAuditEntries] = useState([]);

  // Polls GET /api/status every 2 seconds, returns { auth_api, patient_db, billing_api }
  const { services, isLoading } = useSystemState();

  // WebSocket connection to OpenClaw gateway (ws://127.0.0.1:18789)
  // onBlock: ArmorClaw blocked a tool call
  // onAllow: ArmorClaw allowed a tool call
  const { sendCommand, isConnected } = useOpenClaw({
    role,
    onBlock: ({ command, reason }) => {
      // Flash the screen red
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 800);

      // Add BLOCK entry to audit log
      setAuditEntries((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          role,
          command,
          decision: 'BLOCK',
          reason,
        },
        ...prev,
      ]);
    },
    onAllow: ({ command, tool }) => {
      // Add ALLOW entry to audit log
      setAuditEntries((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          role,
          command,
          decision: 'ALLOW',
          reason: `Tool '${tool}' executed`,
        },
        ...prev,
      ]);
    },
  });

  return (
    // Outer wrapper — applies red flash animation class when a BLOCK fires
    <div className={`min-h-screen p-4 ${isFlashing ? 'animate-block-flash' : ''}`}>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">MediGuard</h1>
          <p className="text-sm text-gray-500">Autonomous DevOps with Intent Assurance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">
            {isConnected ? 'OpenClaw connected' : 'OpenClaw disconnected'}
          </span>
        </div>
      </header>

      {/* 3-column main layout */}
      <main className="grid grid-cols-[280px_1fr_320px] gap-4 h-[calc(100vh-120px)]">
        {/* LEFT — Infrastructure Map */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-500">Infrastructure</h2>
          {isLoading ? (
            <p className="text-sm text-gray-600">Loading services…</p>
          ) : (
            Object.entries(services).map(([key, service]) => (
              <ServiceCard key={key} serviceKey={key} service={service} />
            ))
          )}
        </section>

        {/* CENTER — Chat + Role Selector */}
        <section>
          <ChatPanel role={role} onRoleChange={setRole} onSend={sendCommand} />
        </section>

        {/* RIGHT — Audit Log */}
        <section className="flex flex-col gap-3 overflow-hidden">
          <h2 className="text-xs uppercase tracking-widest text-gray-500">Audit Log</h2>
          <AuditLog entries={auditEntries} />
        </section>
      </main>
    </div>
  );
}
