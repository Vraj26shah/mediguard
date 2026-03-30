
import React from 'react';

export default function ServiceCard({ serviceKey, service }) {
  if (!service) return null;
  const isOnline = service.status === 'online';

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-500 ${
        isOnline
          ? 'border-green-800 bg-green-950/30'
          : 'border-red-800 bg-red-950/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-200">{service.name}</span>
        {service.containsPHI && (
          <span className="text-[10px] bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded">
            PHI
          </span>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-500'}`}
        />
        <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          {service.status.toUpperCase()}
        </span>
      </div>

      {/* Uptime */}
      <p className="mt-2 text-[11px] text-gray-500">
        Uptime: {service.uptime}%
      </p>

      {/* Last action (if any) */}
      {service.lastAction && (
        <p className="mt-1 text-[10px] text-gray-600 truncate">
          Last: {service.lastAction.type} at{' '}
          {new Date(service.lastAction.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
