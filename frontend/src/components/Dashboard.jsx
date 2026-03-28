import { useState, useEffect } from 'react';

const ROLE_PERMISSIONS = {
  junior_dev: {
    name: 'Junior Developer',
    permissions: [
      { action: 'read', resource: 'services', allowed: true },
      { action: 'restart', resource: 'services', allowed: true },
      { action: 'drop', resource: 'databases', allowed: false },
      { action: 'delete', resource: 'admin', allowed: false },
    ],
  },
  senior_dev: {
    name: 'Senior Developer',
    permissions: [
      { action: 'read', resource: 'services', allowed: true },
      { action: 'restart', resource: 'services', allowed: true },
      { action: 'drop', resource: 'databases', allowed: false },
      { action: 'delete', resource: 'admin', allowed: false },
    ],
  },
  project_manager: {
    name: 'Project Manager',
    permissions: [
      { action: 'read', resource: 'services', allowed: true },
      { action: 'restart', resource: 'services', allowed: true },
      { action: 'drop', resource: 'databases', allowed: true },
      { action: 'delete', resource: 'admin', allowed: false },
    ],
  },
};

export default function Dashboard({
  role,
  services,
  isLoading,
  auditEntries,
  sendCommand,
  isConnected,
}) {
  const [aiCommand, setAiCommand] = useState('');
  const [stats, setStats] = useState({
    totalServices: 3,
    healthyServices: 3,
    blockedAttempts: 0,
    allowedActions: 0,
  });

  useEffect(() => {
    setStats({
      totalServices: Object.keys(services).length,
      healthyServices: Object.values(services).filter(s => s.status === 'online').length,
      blockedAttempts: auditEntries.filter(e => e.decision === 'BLOCK').length,
      allowedActions: auditEntries.filter(e => e.decision === 'ALLOW').length,
    });
  }, [services, auditEntries]);

  const handleSendCommand = (e) => {
    e.preventDefault();
    if (aiCommand.trim()) {
      sendCommand(aiCommand);
      setAiCommand('');
    }
  };

  const getRiskLevel = (service) => {
    const uptime = service.uptime;
    if (uptime >= 99.5) return { level: 'excellent', color: 'emerald', label: 'Excellent', icon: '✓' };
    if (uptime >= 99) return { level: 'good', color: 'green', label: 'Healthy', icon: '✓' };
    if (uptime >= 98) return { level: 'warning', color: 'amber', label: 'Caution', icon: '!' };
    return { level: 'critical', color: 'red', label: 'Critical', icon: '✕' };
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      <div className="p-8 space-y-8">
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/20 border border-blue-800/50 rounded-xl p-6 hover:border-blue-700/80 transition-all">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Total Services</p>
            <p className="text-4xl font-black text-white mb-2">{stats.totalServices}</p>
            <p className="text-xs text-gray-400">Healthcare Infrastructure</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/20 border border-emerald-800/50 rounded-xl p-6 hover:border-emerald-700/80 transition-all">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Online Services</p>
            <p className="text-4xl font-black text-white mb-2">{stats.healthyServices}</p>
            <p className="text-xs text-gray-400">All systems operational</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/40 to-green-950/20 border border-green-800/50 rounded-xl p-6 hover:border-green-700/80 transition-all">
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">Actions Allowed</p>
            <p className="text-4xl font-black text-white mb-2">{stats.allowedActions}</p>
            <p className="text-xs text-gray-400">By ArmorClaw policy</p>
          </div>

          <div className="bg-gradient-to-br from-red-900/40 to-red-950/20 border border-red-800/50 rounded-xl p-6 hover:border-red-700/80 transition-all">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Blocked Attempts</p>
            <p className="text-4xl font-black text-white mb-2">{stats.blockedAttempts}</p>
            <p className="text-xs text-gray-400">Policy violations prevented</p>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-3 gap-8">
          {/* LEFT COLUMN - Infrastructure & Permissions */}
          <div className="col-span-2 space-y-8">
            {/* Infrastructure Services */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Infrastructure Health</h2>
                <span className="text-xs font-bold text-gray-500">Real-time Status</span>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-sm text-gray-500 py-8 text-center">Loading services...</p>
                ) : (
                  Object.entries(services).map(([key, service]) => {
                    const risk = getRiskLevel(service);
                    return (
                      <div
                        key={key}
                        className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5 hover:border-gray-600/80 transition-all hover:bg-gray-800/70"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-white mb-1">{service.name}</h3>
                            <p className="text-xs text-gray-400">
                              Status: <span className={`text-${risk.color}-400 font-semibold`}>{service.status.toUpperCase()}</span>
                            </p>
                          </div>
                          <div className={`px-3 py-1.5 rounded-lg bg-${risk.color}-500/20 border border-${risk.color}-500/40`}>
                            <span className={`text-sm font-bold text-${risk.color}-400`}>{risk.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r from-${risk.color}-500 to-${risk.color}-600 rounded-full`}
                                style={{ width: `${service.uptime}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Uptime: <span className="font-mono text-gray-400">{service.uptime}%</span></p>
                          </div>
                          <div className={`ml-4 w-10 h-10 rounded-full bg-${risk.color}-500/20 border-2 border-${risk.color}-500/50 flex items-center justify-center`}>
                            <span className={`text-${risk.color}-400 font-bold`}>{risk.icon}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Access Control Matrix */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-8">
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6">Access Control</h2>
              <div className="space-y-3">
                {ROLE_PERMISSIONS[role].permissions.map((perm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/80 transition-all">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-200">
                        <span className="text-blue-400">{perm.action}</span>
                        <span className="text-gray-600 mx-2">/</span>
                        <span className="text-gray-400">{perm.resource}</span>
                      </p>
                    </div>
                    {perm.allowed ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-xs font-bold text-green-400 uppercase">Allowed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-xs font-bold text-red-400 uppercase">Blocked</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - AI & Policy */}
          <div className="space-y-8">
            {/* AI Command Interface */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-8 flex flex-col h-96">
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4">AI Commands</h2>
              <form onSubmit={handleSendCommand} className="flex-1 flex flex-col">
                <textarea
                  value={aiCommand}
                  onChange={(e) => setAiCommand(e.target.value)}
                  placeholder="Type natural language command..."
                  disabled={!isConnected}
                  className="flex-1 bg-gray-800 text-gray-200 text-sm font-mono border border-gray-700 rounded-lg p-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 mb-4 resize-none disabled:opacity-50 placeholder-gray-600"
                />
                <button
                  type="submit"
                  disabled={!isConnected || !aiCommand.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-600/30 uppercase text-sm tracking-wider"
                >
                  Execute Command
                </button>
              </form>
            </div>

            {/* ArmorClaw Policy */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-8">
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6">ArmorClaw Policy</h2>
              <div className="space-y-4">
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-2">Default Action</p>
                  <p className="text-2xl font-black text-purple-400">DENY</p>
                  <p className="text-xs text-gray-500 mt-2">Secure-by-default architecture</p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-2">Active Rules</p>
                  <p className="text-2xl font-black text-blue-400">6</p>
                  <p className="text-xs text-gray-500 mt-2">Policy rules enforced</p>
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-xs text-green-300 font-bold uppercase tracking-wider mb-2">Last Updated</p>
                  <p className="text-lg font-black text-green-400">Today</p>
                  <p className="text-xs text-gray-500 mt-2">Policy is current</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AUDIT LOG */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Prompt Audit Trail</h2>
            <span className="text-xs font-bold text-gray-500">{auditEntries.length} Events</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-4">
            {auditEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 font-semibold mb-2">No prompts executed yet</p>
                <p className="text-xs text-gray-600">Execute a command to see the audit trail</p>
              </div>
            ) : (
              auditEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-lg border transition-all ${
                    entry.decision === 'ALLOW'
                      ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                      : 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-mono text-gray-300 flex-1 break-words">{entry.command}</p>
                    <span
                      className={`ml-3 px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap flex-shrink-0 ${
                        entry.decision === 'ALLOW'
                          ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                          : 'bg-red-500/30 text-red-400 border border-red-500/50'
                      }`}
                    >
                      {entry.decision}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Role: <span className="text-gray-400 font-semibold">{entry.role}</span>
                  </p>
                  <p className="text-xs text-gray-600 border-t border-gray-700/50 pt-2 mb-2">
                    {entry.reason}
                  </p>
                  <p className="text-xs text-gray-700">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
