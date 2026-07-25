import { useMemo } from 'react';
import { FiUsers, FiUser, FiMapPin, FiBookOpen, FiCalendar } from 'react-icons/fi';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { todayName, formatMinutes } from '../utils/time';

const COLORS = ['#E8A33D', '#3E6E84', '#4C8C6B', '#C1503F', '#8B5CF6', '#0EA5E9', '#F97316', '#14B8A6'];

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-4 sm:p-5 flex items-center gap-3.5">
      <div className="w-11 h-11 rounded-xl bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950 flex items-center justify-center shrink-0">
        <Icon size={19} />
      </div>
      <div>
        <div className="font-display text-2xl font-semibold leading-none">{value.toLocaleString()}</div>
        <div className="eyebrow mt-1">{label}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, height = 260 }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="eyebrow mb-3">{title}</div>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { store } = useData();

  const today = todayName();

  const stats = useMemo(() => {
    const classesToday = store.master.filter((m) => m.day === today).length;
    return { ...store.counts, classesToday };
  }, [store, today]);

  const studentsBySemester = useMemo(() => {
    const map = new Map();
    for (const s of store.studentsMap.values()) {
      const key = `Sem ${s.semester}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
  }, [store]);

  const classesByTimeSlot = useMemo(() => {
    const map = new Map();
    for (const m of store.master) {
      const hour = Math.floor(m.start / 60);
      const key = formatMinutes(hour * 60).replace(':00', '');
      map.set(key, (map.get(key) || 0) + 1);
    }
    // Sort by hour (8 AM → 5 PM ascending)
    return Array.from(map, ([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const toH = (label) => {
          const [h, period] = label.split(' ');
          let hour = parseInt(h, 10);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          return hour;
        };
        return toH(a.name) - toH(b.name);
      });
  }, [store]);

  const roomUtilization = useMemo(() => {
    return Array.from(store.byRoom, ([name, rows]) => ({ name, value: rows.length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [store]);

  const facultyWorkload = useMemo(() => {
    return Array.from(store.byFaculty, ([name, rows]) => ({ name, value: rows.length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [store]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Campus overview</h1>
        <p className="text-sm text-slate2-500 mt-1">A live read of every section, room and faculty slot on the timetable.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={FiUsers} label="Students" value={stats.students} />
        <StatCard icon={FiUser} label="Faculty" value={stats.faculty} />
        <StatCard icon={FiMapPin} label="Rooms" value={stats.rooms} />
        <StatCard icon={FiBookOpen} label="Subjects" value={stats.subjects} />
        <StatCard icon={FiCalendar} label={`Classes ${today ? 'today' : ''}`} value={stats.classesToday} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        <ChartCard title="Students by semester">
          <ResponsiveContainer>
            <BarChart data={studentsBySemester}>
              <CartesianGrid strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {studentsBySemester.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Classes by time slot">
          <ResponsiveContainer>
            <BarChart data={classesByTimeSlot}>
              <CartesianGrid strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
              <Bar dataKey="value" fill="#3E6E84" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Busiest rooms" height={320}>
          <ResponsiveContainer>
            <BarChart data={roomUtilization} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeOpacity={0.1} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: 'monospace' }} width={70} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
              <Bar dataKey="value" fill="#E8A33D" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Faculty workload (top 10)" height={320}>
          <ResponsiveContainer>
            <BarChart data={facultyWorkload} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeOpacity={0.1} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
              <Bar dataKey="value" fill="#4C8C6B" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
