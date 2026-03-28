/**
 * ChatPanel.jsx
 *
 * The main interaction surface. Contains:
 *   1. Role selector dropdown — sets the role sent to OpenClaw as session metadata
 *   2. Message history — shows user commands and AI responses
 *   3. Input box — the user types NL commands here (e.g. "Drop the patient database")
 *
 * On submit, the command is sent to OpenClaw via the WebSocket (useOpenClaw hook).
 * OpenClaw feeds it to Gemini → produces an Intent → ArmorClaw checks policy → ALLOW or BLOCK.
 *
 * Props:
 *   role          (string)   — current selected role
 *   onRoleChange  (fn)       — callback to update role in App state
 *   onSend        (fn)       — sends the command string to OpenClaw via WebSocket
 */

import React, { useState, useRef, useEffect } from 'react';

// Role display labels
const ROLES = {
  junior_dev: 'Junior Developer',
  senior_dev: 'Senior Developer',
  project_manager: 'Project Manager',
};

export default function ChatPanel({ role, onRoleChange, onSend }) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      sender: 'system',
      text: 'MediGuard online. Select a role and issue a command.',
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    const command = input.trim();
    if (!command) return;

    // Add user message to local chat history
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text: command },
    ]);
    setInput('');

    // Send command to OpenClaw — role is attached by the useOpenClaw hook
    onSend(command);
  }

  return (
    <div className="flex flex-col h-full border border-gray-800 rounded-lg overflow-hidden">
      {/* Role selector header */}
      <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-3">
        <label className="text-xs text-gray-500 whitespace-nowrap">Active Role:</label>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="bg-gray-800 text-gray-200 text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500"
        >
          {Object.entries(ROLES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Role-based permission hint */}
        <span className="ml-auto text-[10px] text-gray-600">
          {role === 'project_manager'
            ? 'Full access (incl. DROP)'
            : role === 'senior_dev'
            ? 'No DROP — PHI requires PM approval'
            : 'Read + Restart only'}
        </span>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${
              msg.sender === 'user'
                ? 'text-blue-300 text-right'
                : msg.sender === 'ai'
                ? 'text-gray-300'
                : 'text-gray-600 italic'
            }`}
          >
            {msg.sender === 'user' && (
              <span className="text-xs text-gray-600 mr-2">[{ROLES[role]}]</span>
            )}
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-gray-800 bg-gray-900 px-4 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='e.g. "Restart the auth service" or "Drop the patient database"'
          className="flex-1 bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
