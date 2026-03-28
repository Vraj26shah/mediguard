/**
 * MediGuard — Mock Infrastructure Backend
 *
 * Simulates a healthcare platform with 3 services:
 *   - Auth API      (authentication service)
 *   - Patient DB    (PHI data — protected)
 *   - Billing API   (billing service)
 *
 * Routes:
 *   GET    /api/status              → returns current state of all services
 *   POST   /api/action/restart      → restarts a named service (sets it back online)
 *   DELETE /api/action/drop         → drops a named service/database (sets it offline)
 *
 * No real database — state lives entirely in the `systemState` object below.
 * Port: 4000
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Simulated Infrastructure State ──────────────────────────────────────────
// This is the single source of truth for all service statuses.
// Each service has: status ('online' | 'offline'), uptime (seconds), and lastAction.
const systemState = {
  auth_api: {
    name: 'Auth API',
    status: 'online',
    uptime: 99.9,
    lastAction: null,
  },
  patient_db: {
    name: 'Patient DB',
    status: 'online',
    uptime: 99.7,
    lastAction: null,
    containsPHI: true,   // flag used in policy decisions
  },
  billing_api: {
    name: 'Billing API',
    status: 'online',
    uptime: 98.5,
    lastAction: null,
  },
};

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/status
 * Returns the full systemState object so the frontend can render service cards.
 * The React hook useSystemState.js polls this every 2 seconds.
 */
app.get('/api/status', (req, res) => {
  res.json({ success: true, services: systemState });
});

/**
 * POST /api/action/restart
 * Body: { service: 'patient_db' }
 * Sets the named service back to 'online'.
 * Called by OpenClaw when ArmorClaw ALLOWS a restart_service tool call.
 */
app.post('/api/action/restart', (req, res) => {
  const { service } = req.body;

  if (!systemState[service]) {
    return res.status(404).json({ success: false, error: `Service '${service}' not found` });
  }

  systemState[service].status = 'online';
  systemState[service].lastAction = { type: 'restart', timestamp: new Date().toISOString() };

  console.log(`[RESTART] ${service} → online`);
  res.json({ success: true, service, newStatus: 'online' });
});

/**
 * DELETE /api/action/drop
 * Body: { service: 'patient_db' }
 * Sets the named service to 'offline' (simulates a database drop or service kill).
 * Only called by OpenClaw when ArmorClaw ALLOWS a drop_database tool call.
 * Junior Dev and Senior Dev roles are BLOCKED from this by ArmorClaw policy.
 */
app.delete('/api/action/drop', (req, res) => {
  const { service } = req.body;

  if (!systemState[service]) {
    return res.status(404).json({ success: false, error: `Service '${service}' not found` });
  }

  systemState[service].status = 'offline';
  systemState[service].lastAction = { type: 'drop', timestamp: new Date().toISOString() };

  console.log(`[DROP] ${service} → offline`);
  res.json({ success: true, service, newStatus: 'offline' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`MediGuard backend running on http://localhost:${PORT}`);
  console.log('Routes: GET /api/status | POST /api/action/restart | DELETE /api/action/drop');
});
