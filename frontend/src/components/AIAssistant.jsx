/**
 * ═══════════════════════════════════════════════════════════════════════
 * AIASSISTANT.JSX — Code-Context-Aware AI Chat
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Right sidebar AI chat component in IDE view:
 *   • Terminal-style messages (> user input, system responses)
 *   • Quick-action chips for common requests
 *   • Commands prepended with active file name for context
 *   • Auto-scroll to latest message
 *   • OpenClaw connection status in input placeholder
 */

import { useState, useRef, useEffect } from 'react';

const QUICK_ACTIONS = [
  'review this file',
  'explain the logic',
  'find security issues',
  'suggest improvements',
];

export default function AIAssistant({ role, onSend, isConnected, activeFile }) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      sender: 'system',
      text: 'Ready to help. Ask me anything about this code.',
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;

    const command = input.trim();
    const contextCommand = activeFile
      ? `[${activeFile.name}] ${command}`
      : command;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: command,
      },
    ]);

    onSend(contextCommand);
    setInput('');
  };

  const handleQuickAction = (action) => {
    setInput(action);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-950">
        {messages.map((msg) => (
          <div key={msg.id} className="text-xs font-mono">
            {msg.sender === 'system' && (
              <div className="text-gray-600">
                {msg.text}
              </div>
            )}
            {msg.sender === 'user' && (
              <div className="text-blue-300">
                <span className="text-gray-600">&gt; </span>
                {msg.text}
              </div>
            )}
            {msg.sender === 'ai' && (
              <div className="text-gray-300">
                {msg.text}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t border-gray-800 bg-gray-900">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => handleQuickAction(action)}
            className="text-[10px] border border-gray-700 text-gray-500 px-2 py-0.5 rounded hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer font-mono whitespace-nowrap"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-2 border-t border-gray-800 bg-gray-900 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isConnected ? 'Ask AI...' : 'Connecting...'}
          disabled={!isConnected}
          className="flex-1 bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded border border-gray-700 focus:border-blue-500 focus:outline-none font-mono placeholder-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!isConnected || !input.trim()}
          className="text-xs px-2 py-1 bg-gray-800 text-blue-400 border border-gray-700 rounded hover:bg-gray-700 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono whitespace-nowrap"
        >
          Send
        </button>
      </form>
    </div>
  );
}
