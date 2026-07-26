import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState({});
  const [store, setStore] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function load() {
      try {
        setStatus('loading');
        setProgress({ loading: 'Fetching data from server...' });
        const res = await api.get('/store');
        if (cancelled) return;

        const s = res.data;

        const studentsMap = new Map((s.studentsArray || []).map((st) => [st.reg, st]));
        const byRoom = new Map(s.byRoomEntries || []);
        const byFaculty = new Map(s.byFacultyEntries || []);
        const attendeeIndex = new Map(s.attendeeIndexEntries || []);

        const built = {
          studentsMap,
          studentIndex: s.studentIndex,
          flatSessions: s.flatSessions,
          theory: s.theory,
          lab: s.lab,
          master: s.master,
          byRoom,
          byFaculty,
          attendeeIndex,
          facets: s.facets,
          counts: s.counts,
        };

        setStore(built);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err);
        setStatus('error');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  const value = useMemo(() => ({ status, progress, store, error }), [status, progress, store, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
