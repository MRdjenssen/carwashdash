// Finalized TabletView with improved UI layout and interactions with new ochtend/middag/avond layout

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
  const [view, setView] = useState('vandaag');
  const [today, setToday] = useState(dayjs().format('YYYY-MM-DD'));
  const [todayTasks, setTodayTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
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

  const toggleDoneTask = async (taskId, current, isWeekly = false) => {
    await updateDoc(doc(db, isWeekly ? 'weeklyTasks' : 'tasks', taskId), { done: !current });
  };

  const toggleNoteExpand = (id) => {
    setExpandedNotes(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const toggleSectionExpand = (period) => {
    setExpandedSections(prev => ({ ...prev, [period]: !prev[period] }));
  };

  const TaskItem = ({ id, text, done, notes, isWeekly }) => (
    <div className="bg-white rounded-xl p-4 shadow flex items-start space-x-4 border border-gray-200">
      <button
        onClick={() => toggleDoneTask(id, done, isWeekly)}
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

  const navTabs = [
    { id: 'vandaag', label: 'Vandaag', icon: '📅' },
    { id: 'weektaken', label: 'Weektaken', icon: '🗓' },
    { id: 'kennisbank', label: 'Kennisbank', icon: '📚' },
    { id: 'bestellen', label: 'Bestellen', icon: '🛒' },
  ];

  const periods = ['ochtend', 'middag', 'avond'];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 relative pb-24">
      <div className="flex justify-between items-center px-4 py-4 shadow bg-white">
        <img
          src="https://23g-sharedhosting-grit-wordpress.s3.eu-west-1.amazonaws.com/wp-content/uploads/sites/13/2023/11/30093636/Logo_kort_wit.png"
          alt="Logo"
          className="h-10 bg-green-600 p-1 rounded"
        />
        <span className="text-sm font-medium text-gray-600">{currentTime}</span>
        <button className="text-sm text-red-600 font-semibold">Log uit</button>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {view === 'vandaag' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Taken voor {dayjs(today).format('dddd DD MMMM')}</h2>
            {periods.map(period => {
              const tasks = todayTasks.filter(t => t.period === period);
              const isExpanded = expandedSections[period];
              return (
                <div key={period} className="rounded-xl overflow-hidden border border-gray-200">
                  <button onClick={() => toggleSectionExpand(period)} className={`w-full text-left px-4 py-3 font-semibold border-b ${isExpanded ? 'bg-green-600 text-white' : 'bg-white text-black'}`}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                  {isExpanded && (
                    <div className="bg-white p-4 space-y-3">
                      {tasks.length > 0 ? tasks.map(task => (
                        <TaskItem key={task.id} id={task.id} text={task.text} notes={task.notes} done={task.done} />
                      )) : <p className="text-sm italic text-gray-500">Geen taken</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === 'weektaken' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Weektaken</h2>
            {['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'].map((dayName, i) => {
              const date = dayjs().startOf('week').add(i + 1, 'day').format('YYYY-MM-DD');
              const items = weeklyTasks.filter(t => t.date === date);
              const isExpanded = expandedSections[date];
              return (
                <div key={dayName} className="rounded-xl overflow-hidden border border-gray-200">
                  <button onClick={() => toggleSectionExpand(date)} className={`w-full text-left px-4 py-3 font-semibold border-b ${isExpanded ? 'bg-green-600 text-white' : 'bg-white text-black'}`}>
                    {dayjs(date).format('dddd DD MMMM')}
                  </button>
                  {isExpanded && (
                    <div className="bg-white p-4 space-y-3">
                      {items.length > 0 ? items.map(task => (
                        <TaskItem key={task.id} id={task.id} text={task.text} notes={task.notes} done={task.done} isWeekly={true} />
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
            {notes.map(note => {
              const isExpanded = expandedNotes.includes(note.id);
              return (
                <div key={note.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleNoteExpand(note.id)}
                    className={`w-full text-left px-4 py-3 font-semibold border-b ${isExpanded ? 'bg-green-600 text-white' : 'bg-white text-black'}`}
                  >
                    {note.title}
                  </button>
                  {isExpanded && (
                    <div className="bg-white px-4 py-3 text-sm whitespace-pre-wrap">
                      {note.content}
                    </div>
                  )}
                </div>
              );
            })}
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
              <button type="submit" className="w-full bg-white text-black border border-gray-300 hover:border-green-600 py-2 rounded font-bold">Versturen</button>
            </form>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 shadow-inner z-10">
        {navTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex flex-col items-center text-sm ${view === tab.id ? 'text-green-600 font-bold' : 'text-gray-500'}`}
          >
            <div className="text-xl">{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
