/**
 * AuditLog.jsx
 *
 * Shows a scrollable log of every tool call decision made by ArmorClaw.
 * Each entry is either ALLOW (green) or BLOCK (red).
 *
 * This is the evidence trail — judges can see that policy enforcement
 * is happening in real-time, not just UI-level blocking.
 *
 * Props:
 *   entries (array) — list of { id, timestamp, role, command, decision, reason }
 *                     populated by onAllow / onBlock callbacks in App.jsx
 */

import React from 'react';

const ROLE_LABELS = {
  junior_dev: 'Junior Dev',
  senior_dev: 'Senior Dev',
  project_manager: 'PM',
};

export default function AuditLog({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-700 text-sm">
        No actions yet
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`rounded border px-3 py-2 text-xs ${
            entry.decision === 'ALLOW'
              ? 'border-green-900 bg-green-950/40'
              : 'border-red-900 bg-red-950/40'
          }`}
        >
          {/* Decision badge + role */}
          <div className="flex items-center justify-between mb-1">
            <span
              className={`font-bold tracking-wider ${
                entry.decision === 'ALLOW' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {entry.decision}
            </span>
            <span className="text-gray-600">
              {ROLE_LABELS[entry.role] ?? entry.role}
            </span>
          </div>

          {/* Command */}
          <p className="text-gray-300 mb-1 truncate" title={entry.command}>
            "{entry.command}"
          </p>

          {/* Reason */}
          <p className="text-gray-600 truncate" title={entry.reason}>
            {entry.reason}
          </p>

          {/* Timestamp */}
          <p className="text-gray-700 mt-1">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </div>
  );
}
