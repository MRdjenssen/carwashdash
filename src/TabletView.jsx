// TabletView.jsx — updated to merge daily tasks into Weektaken view
import { useEffect, useState } from 'react';
import app from './firebaseConfig';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  orderBy
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import dayjs from 'dayjs';

const db = getFirestore(app);
const auth = getAuth(app);

export default function TabletView() {
  const [view, setView] = useState('home');
  const [todayTasks, setTodayTasks] = useState(null);
  const [weeklyTasks, setWeeklyTasks] = useState(null);
  const [openDays, setOpenDays] = useState([]);
  const [kennisbank, setKennisbank] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError('');
    } catch (err) {
      setError('Login mislukt. Probeer opnieuw.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('home');
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date().toLocaleString('nl-NL', {
        timeZone: 'Europe/Amsterdam',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(now);
    };
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!user) return;
    const today = dayjs().format('YYYY-MM-DD');

    const unsub = onSnapshot(query(collection(db, 'tasks'), where('date', '==', today)), (snapshot) => {
      const plain = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), from: 'daily' }));

      getDocs(collection(db, 'weeklyTasks')).then(weeklySnap => {
        const todayObj = dayjs();
        const weeklyToday = weeklySnap.docs.map(doc => {
          const data = doc.data();
          const taskDate = dayjs(data.date);
          const repeat = data.repeat || 'once';

          let due = false;
          if (repeat === 'daily') due = true;
          else if (repeat === 'weekly') due = todayObj.day() === taskDate.day();
          else if (repeat === 'monthly') due = todayObj.date() === taskDate.date();
          else if (repeat === 'once') due = todayObj.isSame(taskDate, 'day');

          return due ? { id: doc.id, ...data, from: 'weekly' } : null;
        }).filter(Boolean);

        setTodayTasks([...plain, ...weeklyToday]);
      });
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const today = dayjs();
    const next7 = [...Array(7)].map((_, i) => today.add(i, 'day').format('YYYY-MM-DD'));

    const loadWeeklyTasks = async () => {
      const weekSnap = await getDocs(collection(db, 'weeklyTasks'));
      const weekList = [];

      for (const docSnap of weekSnap.docs) {
        const data = docSnap.data();
        const baseDate = dayjs(data.date);
        const repeat = data.repeat || 'once';

        next7.forEach(dateStr => {
          const checkDate = dayjs(dateStr);
          let match = false;

          if (repeat === 'daily') match = true;
          else if (repeat === 'weekly') match = checkDate.day() === baseDate.day();
          else if (repeat === 'monthly') match = checkDate.date() === baseDate.date();
          else if (repeat === 'once') match = checkDate.isSame(baseDate, 'day');

          if (match) {
            weekList.push({ id: docSnap.id, ...data, showDate: dateStr });
          }
        });
      }

      // Now merge daily tasks
      const dailySnap = await getDocs(query(collection(db, 'tasks'), where('date', 'in', next7)));
      const dailyList = dailySnap.docs.map(doc => ({ id: doc.id, ...doc.data(), showDate: doc.data().date, from: 'daily' }));

      setWeeklyTasks([...weekList, ...dailyList]);
    };

    loadWeeklyTasks();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'kennisbank'), (snapshot) => {
      setKennisbank(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), open: false })));
    });
    return () => unsub();
  }, [user]);

  const toggleTask = (taskId, from, current) => {
    const coll = from === 'daily' ? 'tasks' : 'weeklyTasks';
    updateDoc(doc(db, coll, taskId), { done: !current });
  };

  const toggleTab = (id) => {
    setKennisbank(
      kennisbank.map((tab) =>
        tab.id === id ? { ...tab, open: !tab.open } : tab
      )
    );
  };

  const toggleDay = (day) => {
    setOpenDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const backgroundStyle = {
    backgroundImage: 'url(https://www.poste.sm/wp-content/uploads/2023/01/bg-1-poste.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };

  // ... rendering logic continues unchanged ...
