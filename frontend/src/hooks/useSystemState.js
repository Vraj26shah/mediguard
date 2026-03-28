/**
 * useSystemState.js
 *
 * Custom React hook that polls GET /api/status every 2 seconds
 * and returns the current service states.
 *
 * The Vite proxy in vite.config.js forwards /api → http://localhost:4000
 * so no hardcoded backend URL is needed here.
 *
 * Returns:
 *   services  (object) — { auth_api: {...}, patient_db: {...}, billing_api: {...} }
 *   isLoading (bool)   — true on the first fetch before any data arrives
 *   error     (string | null) — set if the fetch fails
 */

import { useState, useEffect } from 'react';

const POLL_INTERVAL_MS = 2000;

export default function useSystemState() {
  const [services, setServices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        const data = await res.json();

        if (isMounted) {
          setServices(data.services);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    // Fetch immediately, then start polling
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { services, isLoading, error };
}
