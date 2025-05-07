// FULL TabletView.jsx with 'Bestellen' tab replacing 'Verkoop'
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
  addDoc
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

  // Bestellen form state
  const [orderType, setOrderType] = useState('kleding');
  const [orderText, setOrderText] = useState('');
  const [orderTarget, setOrderTarget] = useState('');
  const [orderSent, setOrderSent] = useState(false);

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

  const sendOrder = async () => {
    if (!orderText.trim() || !orderTarget.trim()) return;
    await addDoc(collection(db, 'orders'), {
      type: orderType,
      text: orderText,
      target: orderTarget,
      timestamp: Date.now(),
      done: false
    });
    setOrderSent(true);
    setOrderText('');
    setOrderTarget('');
  };

  const backgroundStyle = {
    backgroundImage: 'url(https://www.poste.sm/wp-content/uploads/2023/01/bg-1-poste.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white p-4">
        <h2 className="text-2xl font-bold mb-4">Tablet Login</h2>
        <form onSubmit={handleLogin} className="w-full max-w-xs">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-2 rounded text-black" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Wachtwoord" className="w-full p-2 mb-2 rounded text-black" />
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">Log in</button>
        </form>
      </div>
    );
  }

  if (todayTasks === null || weeklyTasks === null || kennisbank === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Bezig met laden...</p>
      </div>
    );
  }

  if (view === 'home') {
    return (
      <div className="min-h-screen text-white p-6 font-sans text-center" style={backgroundStyle}>
        <img
          src="https://23g-sharedhosting-grit-wordpress.s3.eu-west-1.amazonaws.com/wp-content/uploads/sites/13/2023/11/30093636/Logo_kort_wit.png"
          alt="Carwash Kleiboer wit logo"
          className="mx-auto h-20 mb-6"
        />
        <h1 className="text-2xl font-bold mb-4">{currentTime}</h1>
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
          <button onClick={() => setView('today')} className="bg-green-500 text-white font-bold py-10 rounded-2xl text-xl shadow-lg hover:bg-green-600">Vandaag</button>
          <button onClick={() => setView('week')} className="bg-green-500 text-white font-bold py-10 rounded-2xl text-xl shadow-lg hover:bg-green-600">Weektaken</button>
          <button onClick={() => setView('notes')} className="bg-green-500 text-white font-bold py-10 rounded-2xl text-xl shadow-lg hover:bg-green-600">Kennisbank</button>
          <button onClick={() => setView('bestellen')} className="bg-green-500 text-white font-bold py-10 rounded-2xl text-xl shadow-lg hover:bg-green-600">Bestellen</button>
        </div>
        <button onClick={handleLogout} className="mt-6 text-sm underline">Uitloggen</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-4 text-center font-sans" style={backgroundStyle}>
      <button onClick={() => setView('home')} className="absolute top-4 left-4 bg-white text-green-700 font-bold px-4 py-2 rounded">← Menu</button>
      <h1 className="text-3xl font-bold mb-4">CarwashDash</h1>

      {view === 'today' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Taken voor Vandaag</h2>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div key={task.id} className="bg-white text-black rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className={task.done ? 'line-through text-gray-500' : ''}>{task.text}</p>
                  <small className="text-xs text-gray-600">{task.notes}</small>
                </div>
                <button
                  onClick={() => toggleTask(task.id, task.from, task.done)}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  {task.done ? 'Ongedaan' : 'Klaar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Weektaken (7 dagen vooruit)</h2>
          {Array.from(new Set(weeklyTasks.map(task => task.showDate))).sort().map(date => {
            const day = dayjs(date).format('dddd DD MMMM');
            const open = openDays.includes(date);
            return (
              <div key={date} className="mb-4 text-left">
                <button
                  onClick={() => toggleDay(date)}
                  className="text-white font-bold text-lg w-full text-left"
                >
                  {day} {open ? '▲' : '▼'}
                </button>
                {open && weeklyTasks.filter(task => task.showDate === date).map(task => (
                  <div key={task.id + date} className="bg-white text-black rounded-xl p-4 mb-2">
                    <p className={task.done ? 'line-through text-gray-500' : ''}>{task.text}</p>
                    <small className="text-xs text-gray-600">{task.notes}</small>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {view === 'notes' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Kennisbank</h2>
          <div className="space-y-4">
            {kennisbank.map((tab) => (
              <div key={tab.id} className="bg-white text-black rounded-xl">
                <button
                  className="w-full text-left font-bold p-4 border-b border-gray-300"
                  onClick={() => toggleTab(tab.id)}
                >
                  {tab.title}
                </button>
                {tab.open && (
                  <div className="p-4 whitespace-pre-wrap text-sm">
                    {tab.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'bestellen' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Bestelformulier</h2>
          {orderSent && <p className="text-green-400 font-semibold mb-4">Bestelling verzonden!</p>}
          <select
            className="w-full p-2 rounded mb-3 text-black"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
          >
            <option value="kleding">Kleding</option>
            <option value="onderdelen">Onderdelen</option>
            <option value="producten">Producten</option>
            <option value="overige">Overige</option>
          </select>
          <textarea
            className="w-full p-2 mb-3 rounded text-black"
            placeholder="Wat moet er besteld worden en hoeveel?"
            value={orderText}
            onChange={(e) => setOrderText(e.target.value)}
          />
          <input
            className="w-full p-2 mb-3 rounded text-black"
            placeholder="Voor wie of wat is het?"
            value={orderTarget}
            onChange={(e) => setOrderTarget(e.target.value)}
          />
          <button onClick={sendOrder} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full">
            Versturen
          </button>
        </div>
      )}
    </div>
  );
}
