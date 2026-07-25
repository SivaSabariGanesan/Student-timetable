import { getStore } from '../services/store.js';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function dashboardStats(req, res, next) {
  try {
    const store = await getStore();
    const today = DAY_ORDER[new Date().getDay() - 1] || null;
    const classesToday = today ? store.master.filter((m) => m.day === today).length : 0;

    const studentsBySemester = {};
    for (const s of store.studentsArray) {
      const key = `Sem ${s.semester}`;
      studentsBySemester[key] = (studentsBySemester[key] || 0) + 1;
    }

    const classesByTimeSlot = {};
    for (const m of store.master) {
      const hour = Math.floor(m.start / 60);
      const h12 = hour % 12 || 12;
      const period = hour >= 12 ? 'PM' : 'AM';
      const key = `${h12}:00 ${period}`.replace(':00 ', '');
      classesByTimeSlot[key] = (classesByTimeSlot[key] || 0) + 1;
    }

    const roomUtilization = Array.from(store.byRoom, ([name, rows]) => ({ name, value: rows.length }))
      .sort((a, b) => b.value - a.value).slice(0, 10);

    const facultyWorkload = Array.from(store.byFaculty, ([name, rows]) => ({ name, value: rows.length }))
      .sort((a, b) => b.value - a.value).slice(0, 10);

    res.json({
      counts: store.counts,
      classesToday,
      studentsBySemester: Object.entries(studentsBySemester).map(([name, value]) => ({ name, value })),
      classesByTimeSlot: Object.entries(classesByTimeSlot).map(([name, value]) => ({ name, value })),
      roomUtilization,
      facultyWorkload,
    });
  } catch (err) {
    next(err);
  }
}
