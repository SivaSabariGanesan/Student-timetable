import { getStore, invalidateStore } from '../services/store.js';

export async function getFullStore(req, res, next) {
  try {
    const store = await getStore();

    const serializable = {
      studentIndex: store.studentIndex,
      flatSessions: store.flatSessions,
      theory: store.theory,
      lab: store.lab,
      master: store.master,
      byRoomEntries: Array.from(store.byRoom.entries()),
      byFacultyEntries: Array.from(store.byFaculty.entries()),
      attendeeIndexEntries: Array.from(store.attendeeIndex.entries()),
      facets: store.facets,
      counts: store.counts,
      studentsArray: store.studentsArray,
    };

    res.json(serializable);
  } catch (err) {
    next(err);
  }
}

export async function rebuildStore(req, res, next) {
  try {
    invalidateStore();
    const store = await getStore({ forceRebuild: true });
    res.json({ message: 'Store rebuilt', studentCount: store.studentsArray.length, masterCount: store.master.length });
  } catch (err) {
    next(err);
  }
}
