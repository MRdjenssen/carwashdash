// Refined TabletView.jsx with clean modern UI, lighter theme, and polished design

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import app from './firebaseConfig';

const db = getFirestore(app);

export default function TabletView() {
  const [view, setView] = useState('home');
  const [today, setToday] = useState(dayjs().format('YYYY-MM-DD'));
  const [todayTasks, setTodayTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [expandedDays, setExpandedDays] = useState([]);
  const [expandedNotes, setExpandedNotes] = useState([]);
  const [orderForm, setOrderForm] = useState({ type: 'kleding', text: '', target: '' });
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date().toLocaleString('nl-NL', {
        timeZone: 'Europe/Amsterdam',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentTime(now);
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubToday = onSnapshot(
      query(collection(db, 'tasks'), where('date', '==', today)),
      snapshot => {
        setTodayTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );
    const unsubWeekly = onSnapshot(collection(db, 'weeklyTasks'), snapshot => {
      setWeeklyTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubNotes = onSnapshot(collection(db, 'kennisbank'), snapshot => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubToday();
      unsubWeekly();
      unsubNotes();
    };
  }, [today]);

  const handleOrderChange = (field, value) => {
    setOrderForm({ ...orderForm, [field]: value });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'orders'), {
      ...orderForm,
      done: false,
      archived: false,
      timestamp: Timestamp.now(),
    });
    setOrderForm({ type: 'kleding', text: '', target: '' });
    alert('Bestelling verzonden!');
  };

  const toggleDayExpand = (date) => {
    setExpandedDays(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  const toggleDoneTask = async (taskId, current) => {
    await updateDoc(doc(db, 'tasks', taskId), { done: !current });
  };

  const toggleNoteExpand = (id) => {
    setExpandedNotes(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const TaskItem = ({ id, text, done, notes }) => (
    <div className="bg-white rounded-xl p-4 shadow flex items-start space-x-4 border border-gray-200">
      <button
        onClick={() => toggleDoneTask(id, done)}
        className={`w-6 h-6 rounded-full border-2 mt-1 flex items-center justify-center ${done ? 'border-green-500 bg-green-500' : 'border-gray-400'}`}
      >
        {done && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
      </button>
      <div>
        <p className={`font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{text}</p>
        {notes && <p className="text-sm text-gray-500 italic mt-1">{notes}</p>}
      </div>
    </div>
  );

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gray-100 px-6 py-8 text-gray-800">
        <img
          src="https://23g-sharedhosting-grit-wordpress.s3.eu-west-1.amazonaws.com/wp-content/uploads/sites/13/2023/11/30093636/Logo_kort_wit.png"
          alt="Logo"
          className="mx-auto h-20 mb-4"
        />
        <h1 className="text-center text-lg font-semibold mb-6">{currentTime}</h1>
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
          {['Vandaag', 'Weektaken', 'Kennisbank', 'Bestellen'].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setView(label.toLowerCase())}
              className="bg-green-600 rounded-xl py-8 font-semibold shadow hover:bg-green-700 text-white text-xl"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-800">
      <button onClick={() => setView('home')} className="bg-white text-green-600 px-4 py-2 rounded shadow mb-6 font-semibold border">← Terug</button>
      <h1 className="text-2xl font-bold mb-4">CarwashDash</h1>

      {view === 'vandaag' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Taken voor {dayjs(today).format('dddd DD MMMM')}</h2>
          {todayTasks.map(task => (
            <TaskItem key={task.id} id={task.id} text={task.text} notes={task.notes} done={task.done} />
          ))}
        </div>
      )}

      {view === 'weektaken' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-2">Weektaken</h2>
          {['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'].map((dayName, i) => {
            const date = dayjs().startOf('week').add(i + 1, 'day').format('YYYY-MM-DD');
            const items = weeklyTasks.filter(t => t.date === date);
            return (
              <div key={dayName} className="rounded-xl overflow-hidden border border-gray-200">
                <button onClick={() => toggleDayExpand(date)} className="w-full bg-green-600 text-white text-left px-4 py-3 font-semibold">
                  {dayjs(date).format('dddd DD MMMM')}
                </button>
                {expandedDays.includes(date) && (
                  <div className="bg-white p-4 space-y-3">
                    {items.length > 0 ? items.map(task => (
                      <TaskItem key={task.id} id={task.id} text={task.text} notes={task.notes} done={task.done} />
                    )) : <p className="text-sm italic text-gray-500">Geen taken</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'kennisbank' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Kennisbank</h2>
          {notes.map(note => (
            <div key={note.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleNoteExpand(note.id)}
                className="w-full text-left px-4 py-3 bg-green-600 text-white font-semibold"
              >
                {note.title}
              </button>
              {expandedNotes.includes(note.id) && (
                <div className="bg-white px-4 py-3 text-sm whitespace-pre-wrap">
                  {note.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'bestellen' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Bestelformulier</h2>
          <form onSubmit={handleOrderSubmit} className="bg-white p-4 rounded-xl shadow space-y-4">
            <select
              value={orderForm.type}
              onChange={e => handleOrderChange('type', e.target.value)}
              className="w-full p-2 rounded border border-gray-300"
            >
              <option value="kleding">Kleding</option>
              <option value="onderdelen">Onderdelen</option>
              <option value="producten">Producten</option>
              <option value="overige">Overige</option>
            </select>
            <textarea
              className="w-full p-2 rounded border border-gray-300"
              placeholder="Wat is er nodig en hoeveel?"
              value={orderForm.text}
              onChange={e => handleOrderChange('text', e.target.value)}
              required
            ></textarea>
            <input
              type="text"
              className="w-full p-2 rounded border border-gray-300"
              placeholder="Voor wie of waarvoor is het?"
              value={orderForm.target}
              onChange={e => handleOrderChange('target', e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold">Versturen</button>
          </form>
        </div>
      )}
    </div>
  );
}
