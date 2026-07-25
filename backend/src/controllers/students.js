import { getStore } from '../services/store.js';
import { query } from '../config/db.js';

export async function searchStudents(req, res, next) {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q) {
      return res.json({ results: [] });
    }

    const store = await getStore();
    const results = store.studentIndex.filter(
      (s) => s.reg.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 40);

    const full = results.map((r) => {
      const student = store.studentsArray.find((s) => s.reg === r.reg);
      return student || r;
    });

    res.json({ results: full });
  } catch (err) {
    next(err);
  }
}

export async function getStudent(req, res, next) {
  try {
    const { reg } = req.params;
    const store = await getStore();
    const student = store.studentsArray.find((s) => s.reg === reg);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student });
  } catch (err) {
    next(err);
  }
}

export async function getAllStudents(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await query(
      'SELECT enrollment_number, student_name, email, department_code, department_name, semester FROM student_selection GROUP BY enrollment_number, student_name, email, department_code, department_name, semester ORDER BY enrollment_number LIMIT $1 OFFSET $2',
      [Number(limit), offset]
    );
    res.json({ students: result.rows });
  } catch (err) {
    next(err);
  }
}
