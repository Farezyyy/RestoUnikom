import { useEffect, useState } from 'react';
import api from '../api';
import { getMenuMeta } from './menuMeta';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const COURSE_ORDER = { APPETIZER: 0, MAIN: 1, DESSERT: 2, BEVERAGE: 3 };

// DB course_enum: APPETIZER, MAIN_A, MAIN_B, DESSERT, BEVERAGE.
// Normalize MAIN_A/MAIN_B -> MAIN for display/lookup (which set it belongs to
// is already captured by nama_set).
function normalizeCourse(course = '') {
  if (course === 'MAIN_A' || course === 'MAIN_B') return 'MAIN';
  return course;
}

function weekdayName(tanggal) {
  // tanggal is 'YYYY-MM-DD'
  const d = new Date(tanggal + 'T00:00:00');
  return DAYS[(d.getDay() + 6) % 7]; // getDay: 0=Sun -> map to Mon-first index
}

// Classify a set row as 'A' or 'B' from its nama_set label.
export function setKey(namaSet = '') {
  const upper = namaSet.toUpperCase();
  if (upper.includes('MENU B') || /\bB\b/.test(upper)) return 'B';
  return 'A';
}

// Turns raw /menu-harian?tanggal= rows into set choices for a reservation form.
// -> [{ letter:'A', value:'Menu A', label:'Menu A · Chef\'s Signature', nama_set }, ...]
// value is what we persist in reservasi.pilihan_menu; label is what we show.
export function classifyDailySets(rows = []) {
  const byLetter = {};
  for (const row of rows) {
    if (row.aktif === false) continue;
    const letter = setKey(row.nama_set);
    // Keep the first (or most recent) set per letter for the day.
    if (!byLetter[letter]) {
      byLetter[letter] = {
        letter,
        value: `Menu ${letter}`,
        label: splitSetName(row.nama_set).subtitle
          ? `Menu ${letter} · ${splitSetName(row.nama_set).subtitle}`
          : `Menu ${letter}`,
        nama_set: row.nama_set,
      };
    }
  }
  return ['A', 'B'].map(l => byLetter[l]).filter(Boolean);
}

// Builds { Monday: { A: {name, items:[{course,name,image,allergens,prep,price}]}, B: {...} }, ... }
function buildWeek(harian) {
  const week = {};
  for (const day of DAYS) week[day] = { A: null, B: null };

  for (const row of harian) {
    if (row.aktif === false) continue;
    const day = weekdayName(row.tanggal);
    if (!week[day]) continue;
    const key = setKey(row.nama_set);

    const details = (row.menu_harian_detail || [])
      .filter(d => d.menu)
      .map(d => ({ ...d, course: normalizeCourse(d.course) }))
      .sort((a, b) => (COURSE_ORDER[a.course] ?? 9) - (COURSE_ORDER[b.course] ?? 9));

    const items = details.map(d => {
      const meta = getMenuMeta(d.menu.nama);
      return {
        course: d.course,
        name: d.menu.nama,
        price: Number(d.menu.harga) || 0,
        image: meta.image,
        allergens: meta.allergens,
        prep: meta.prep,
      };
    });

    // Keep the most recent date's set if duplicates exist for the same weekday.
    if (!week[day][key] || row.tanggal >= week[day][key].tanggal) {
      week[day][key] = { name: row.nama_set, tanggal: row.tanggal, items };
    }
  }
  return week;
}

const byCourse = (items, course) => items.find(i => i.course === course);

// nama_set format "Menu A · <tema>" -> title "Menu A", subtitle "<tema>".
function splitSetName(namaSet = '') {
  const [head, ...rest] = namaSet.split('·');
  return { title: head.trim(), subtitle: rest.join('·').trim() };
}

// Adapts a set into the flat shape MenuCard expects
// (appetizer/mainCourse/dessert + *Img, plus title/subtitle from DB nama_set).
export function toMenuCardProps(set) {
  const items = set?.items || [];
  const app = byCourse(items, 'APPETIZER');
  const main = byCourse(items, 'MAIN');
  const dessert = byCourse(items, 'DESSERT');
  const props = {
    appetizer: app?.name || 'Not available',
    appetizerImg: app?.image,
    mainCourse: main?.name || 'Not available',
    mainCourseImg: main?.image,
    dessert: dessert?.name || 'Not available',
    dessertImg: dessert?.image,
  };
  // DB title/subtitle win when present; caller's hardcoded fallback stays otherwise.
  if (set?.name) {
    const { title, subtitle } = splitSetName(set.name);
    if (title) props.title = title;
    if (subtitle) props.subtitle = subtitle;
  }
  return props;
}

export default function useWeeklyMenu() {
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/menu-harian');
        if (!alive) return;
        setWeek(buildWeek(data || []));
      } catch (err) {
        if (!alive) return;
        console.error('Failed to load weekly menu', err);
        setError(err);
        setWeek(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { week, loading, error };
}
