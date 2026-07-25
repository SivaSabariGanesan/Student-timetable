import Papa from 'papaparse';

export function loadCsv(url, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    try {
      console.debug('Starting parse for', url);
      onProgress?.('started');
    } catch (e) {
      // ignore
    }

    const rows = [];

    // Prefer fetching the CSV and parsing the text to avoid Papa's internal XHR (which
    // can fail with invalid URL when the page is opened via file:// or unusual envs).
    const parseText = (text) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        worker: false,
        step: (result) => {
          rows.push(result.data);
          if (onProgress && rows.length % 2000 === 0) onProgress(rows.length);
        },
        complete: () => resolve(rows),
        error: (err) => {
          console.error('Papa.parse(text) error for', url, err);
          try { onProgress?.('error'); } catch (e) {}
          reject(err);
        },
      });
    };

    // Try fetch first; falls back to Papa's download mode if fetch isn't available or fails.
    if (typeof fetch === 'function') {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Network response not ok ${res.status}`);
          return res.text();
        })
        .then((text) => parseText(text))
        .catch((err) => {
          console.warn('Fetch failed for', url, 'falling back to Papa.download', err);
          // fallback to papaparse download (uses XHR internally)
          Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            worker: true,
            step: (result) => {
              rows.push(result.data);
              if (onProgress && rows.length % 2000 === 0) onProgress(rows.length);
            },
            complete: () => resolve(rows),
            error: (err2) => {
              console.error('Papa.parse(download) error for', url, err2);
              try { onProgress?.('error'); } catch (e) {}
              reject(err2);
            },
          });
        });
    } else {
      // No fetch available, use papaparse download mode.
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        worker: true,
        step: (result) => {
          rows.push(result.data);
          if (onProgress && rows.length % 2000 === 0) onProgress(rows.length);
        },
        complete: () => resolve(rows),
        error: (err) => {
          console.error('Papa.parse(download) error for', url, err);
          try { onProgress?.('error'); } catch (e) {}
          reject(err);
        },
      });
    }
  });
}

export async function loadAllCsvs(onProgress) {
  const base = import.meta.env.BASE_URL || '/';
  const [selections, theory, lab] = await Promise.all([
    loadCsv(`${base}data/student_selections_all_depts.csv`, {
      onProgress: (n) => onProgress?.('selections', n),
    }),
    loadCsv(`${base}data/theory_schedule.csv`, {
      onProgress: (n) => onProgress?.('theory', n),
    }),
    loadCsv(`${base}data/lab_schedule.csv`, {
      onProgress: (n) => onProgress?.('lab', n),
    }),
  ]);
  return { selections, theory, lab };
}
