/**
 * ═══════════════════════════════════════════════════════════════════════
 * USESYSTEMSTATE.JS — Backend Status Poller
 * ═══════════════════════════════════════════════════════════════════════
 *
<<<<<<< HEAD
 * Custom React hook that polls GET /api/status every few seconds
 * and returns the current service states.
=======
 * Custom React hook polling GET /api/status every 2 seconds.
 * Updates Dashboard with live service state changes.
>>>>>>> b36a71ba706e72497f688977845d27cc5de0e5ad
 *
 * Vite proxy (vite.config.js) forwards /api → http://localhost:4000
 * so no hardcoded backend URL is needed.
 *
<<<<<<< HEAD
 * When the backend is unreachable (ECONNREFUSED / network error) the hook
 * returns sensible fallback data so the UI still renders, and backs off
 * the polling interval to avoid spamming the Vite console.
 *
 * Returns:
 *   services  (object) — { auth_api: {...}, patient_db: {...}, billing_api: {...} }
 *   isLoading (bool)   — true on the first fetch before any data arrives
 *   error     (string | null) — set if the fetch fails
=======
 * RETURNS:
 *   services  → { auth_api, patient_db, billing_api, ... }
 *   isLoading → true until first data arrives
 *   error     → error message string (or null)
 *
 * USAGE:
 *   const { services, isLoading, error } = useSystemState();
>>>>>>> b36a71ba706e72497f688977845d27cc5de0e5ad
 */

import { useState, useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 2000;
const BACKOFF_INTERVAL_MS = 10000; // poll less often when backend is down

/** Mock services so the UI can still render while the backend is offline */
const FALLBACK_SERVICES = {
  auth_api: {
    name: 'Auth API',
    status: 'offline',
    uptime: 0,
    containsPHI: false,
    lastAction: null,
  },
  patient_db: {
    name: 'Patient DB',
    status: 'offline',
    uptime: 0,
    containsPHI: true,
    lastAction: null,
  },
  billing_api: {
    name: 'Billing API',
    status: 'offline',
    uptime: 0,
    containsPHI: false,
    lastAction: null,
  },
};

export default function useSystemState() {
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const backendDown = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        const data = await res.json();

        if (isMounted) {
          setServices(data.services);
          setIsLoading(false);
          setError(null);
          backendDown.current = false;
        }
      } catch (err) {
        if (isMounted) {
          // On first failure, populate fallback so the UI isn't empty
          if (backendDown.current === false) {
            setServices((prev) =>
              Object.keys(prev).length === 0 ? FALLBACK_SERVICES : prev
            );
          }
          backendDown.current = true;
          setError('Backend unavailable – running in offline mode');
          setIsLoading(false);
        }
      }

      // Schedule next poll — use a longer interval when the backend is down
      if (isMounted) {
        const delay = backendDown.current ? BACKOFF_INTERVAL_MS : POLL_INTERVAL_MS;
        timerId = setTimeout(fetchStatus, delay);
      }
    }

    // Kick off the first fetch
    fetchStatus();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  return { services, isLoading, error };
}
