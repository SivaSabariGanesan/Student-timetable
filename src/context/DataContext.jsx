import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadAllCsvs } from '../services/csvLoader';
import { buildStoreAsync } from '../services/dataStore';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [progress, setProgress] = useState({ selections: 0, theory: 0, lab: 0, building: 0 });
  const [store, setStore] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  function addLog(msg) {
    const line = `${new Date().toISOString()} - ${msg}`;
    setLogs((l) => [line, ...l].slice(0, 200));
    try { console.debug(line); } catch (e) {}
  }

  useEffect(() => {
    let cancelled = false;
    addLog('Beginning CSV load');
    loadAllCsvs((key, n) => {
      if (!cancelled) setProgress((p) => ({ ...p, [key]: n }));
      if (n === 'started') {
        addLog(`${key} parsing started`);
      } else if (n === 'error') {
        addLog(`${key} parsing error reported`);
      } else if (typeof n === 'number' && n > 0 && n % 5000 === 0) {
        addLog(`${key} parsed ${n} rows`);
      }
    })
        .then(async ({ selections, theory, lab }) => {
          if (cancelled) return;
          // try to offload store building to a dedicated worker
          let worker;
          try {
            worker = new Worker(new URL('../workers/buildWorker.js', import.meta.url), { type: 'module' });
          } catch (e) {
            worker = null;
          }

          if (worker) {
            worker.onmessage = (ev) => {
              const msg = ev.data || {};
              if (msg.type === 'progress') {
                if (!cancelled) setProgress((p) => ({ ...p, building: msg.processed }));
                addLog(`Worker processed ${msg.processed} selections`);
                return;
              }
              if (msg.type === 'done') {
                if (cancelled) {
                  worker.terminate();
                  return;
                }
                addLog('Worker finished building store');
                const s = msg.store;
                // reconstruct Maps from serializable payload
                const studentsMap = new Map(s.studentsArray.map((st) => [st.reg, st]));
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
                worker.terminate();
              }
            };
            worker.onerror = (err) => {
              console.error('Worker error', err);
              addLog(`Worker error: ${err?.message || String(err)}`);
              setError(err);
              setStatus('error');
              worker.terminate();
            };
            // post data to worker (structured clone)
            addLog('Posting parsed CSVs to worker');
            worker.postMessage({ selections, theory, lab });
          } else {
            // fallback to async builder on main thread
            addLog('Worker unavailable; falling back to main-thread builder');
            const built = await buildStoreAsync({ selections, theory, lab }, { onProgress: (n) => {
              if (!cancelled) setProgress((p) => ({ ...p, building: n }));
            }});
            if (cancelled) return;
            addLog('Main-thread builder finished');
            setStore(built);
            setStatus('ready');
          }
        })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        addLog(`Load error: ${err?.message || String(err)}`);
        setError(err);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ status, progress, store, error, logs }), [status, progress, store, error, logs]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
