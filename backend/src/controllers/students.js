import { getStore } from '../services/store.js';
import { query } from '../config/db.js';

// V7 [High]: Hard cap on page size to prevent a caller from requesting
// millions of rows and exhausting memory / DB connection pool.
const MAX_LIMIT = 100;

export async function searchStudents(req, res, next) {
  try {
    // Sanitize and cap query string length
    const q = String(req.query.q || '').trim().slice(0, 100).toLowerCase();
    if (!q) return res.json({ results: [] });

    const store = await getStore();
    const results = store.studentIndex.filter(
      (s) => s.reg.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 40);

    const full = results.map((r) => store.studentsArray.find((s) => s.reg === r.reg) || r);
    res.json({ results: full });
  } catch (err) {
    next(err);
  }
}

export async function getStudent(req, res, next) {
  try {
    // Sanitize the reg param — allow alphanumeric only (register numbers are numeric strings)
    const reg = String(req.params.reg || '').replace(/[^\w-]/g, '').slice(0, 30);
    if (!reg) return res.status(400).json({ error: 'Invalid register number' });

    const store = await getStore();
    const student = store.studentsArray.find((s) => s.reg === reg);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    res.json({ student });
  } catch (err) {
    next(err);
  }
}

export async function getAllStudents(req, res, next) {
  try {
    // V7 [High]: Validate and cap pagination parameters.
    // Without a cap, a caller with valid credentials could request limit=999999.
    let page  = parseInt(req.query.page,  10);
    let limit = parseInt(req.query.limit, 10);

    if (!Number.isInteger(page)  || page  < 1) page  = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 50;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT enrollment_number, student_name, department_code, department_name, semester
       FROM student_selection
       GROUP BY enrollment_number, student_name, department_code, department_name, semester
       ORDER BY enrollment_number
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    // V7: Email is omitted from this bulk listing endpoint to reduce PII exposure
    res.json({ students: result.rows, page, limit });
  } catch (err) {
    next(err);
  }
}
