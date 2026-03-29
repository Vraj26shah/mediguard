/**
 * ═══════════════════════════════════════════════════════════════════════
 * USEopenclaw.JS — WebSocket Gateway to AI Agent
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Custom React hook managing WebSocket connection to OpenClaw gateway.
 * OpenClaw endpoint: ws://127.0.0.1:18789 (auto-reconnects if dropped)
 *
 * OUTBOUND MESSAGE FORMAT (to OpenClaw):
 *   {
 *     type: 'message',
 *     role: 'junior_dev' | 'senior_dev' | 'project_manager',
 *     content: 'Drop the patient database'  ← user command
 *   }
 *
 * INBOUND MESSAGE FORMATS (from OpenClaw):
 *   { type: 'armorclaw_block', tool, reason }  ← Policy rejected (→ onBlock callback)
 *   { type: 'armorclaw_allow', tool }          ← Policy approved (→ onAllow callback)
 *   { type: 'message', content }               ← AI response text
 *
 * HOOK OPTIONS:
 *   role   (string) — Current user role (attached to every outgoing message)
 *   onBlock (fn)    — Callback: { command, reason } when ArmorClaw blocks
 *   onAllow (fn)    — Callback: { command, tool } when ArmorClaw allows
 *
 * RETURNS:
 *   sendCommand(cmd)  → Send string to OpenClaw
 *   isConnected       → Boolean: WebSocket.OPEN?
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const OPENCLAW_WS_URL = 'ws://127.0.0.1:18789';
const RECONNECT_DELAY_MS = 3000;

export default function useOpenClaw({ role, onBlock, onAllow }) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Keep role in a ref so the sendCommand closure always reads the current value
  const roleRef = useRef(role);
  useEffect(() => { roleRef.current = role; }, [role]);

  // Keep latest callbacks in refs to avoid stale closures
  const onBlockRef = useRef(onBlock);
  const onAllowRef = useRef(onAllow);
  useEffect(() => { onBlockRef.current = onBlock; }, [onBlock]);
  useEffect(() => { onAllowRef.current = onAllow; }, [onAllow]);

  // Track the last command sent so we can pass it to the callbacks
  const lastCommandRef = useRef('');

  useEffect(() => {
    let reconnectTimer;

    function connect() {
      const ws = new WebSocket(OPENCLAW_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[OpenClaw] WebSocket connected');
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.warn('[OpenClaw] WebSocket disconnected — retrying in 3s');
        setIsConnected(false);
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = (err) => {
        console.error('[OpenClaw] WebSocket error:', err);
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return; // ignore non-JSON frames
        }

        if (msg.type === 'armorclaw_block') {
          // ArmorClaw blocked the intent — trigger red flash + audit log
          onBlockRef.current?.({
            command: lastCommandRef.current,
            reason: msg.reason ?? `Tool '${msg.tool}' blocked by policy`,
          });
        } else if (msg.type === 'armorclaw_allow') {
          // ArmorClaw allowed — the tool will execute against the Express backend
          onAllowRef.current?.({
            command: lastCommandRef.current,
            tool: msg.tool,
          });
        }
        // Other message types (AI text responses) can be handled here later
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []); // only runs once — role and callbacks use refs

  const sendCommand = useCallback((command) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[OpenClaw] Not connected — command dropped');
      return;
    }

    lastCommandRef.current = command;

    wsRef.current.send(
      JSON.stringify({
        type: 'message',
        role: roleRef.current,
        content: command,
      })
    );
  }, []);

  return { sendCommand, isConnected };
}