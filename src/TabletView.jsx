import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  addDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import app from './firebaseConfig';

dayjs.extend(isSameOrBefore);

const db = getFirestore(app);

export default function TabletView() {
  const [view, setView] = useState('vandaag');
  const [today, setToday] = useState(dayjs().format('YYYY-MM-DD'));
  const [allTasks, setAllTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [expandedBlocks, setExpandedBlocks] = useState(['ochtend', 'middag', 'avond']);
  const [expandedNotes, setExpandedNotes] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  const [orderForm, setOrderForm] = useState({ type: 'kleding', text: '', target: '' });
  const [currentTime, setCurrentTime] = useState('');

  // Laad dagtaken & herhalingen
  useEffect(() => {
    // Alles ophalen, filtering gebeurt clientside ivm herhalingen
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubNotes = onSnapshot(collection(db, 'kennisbank'), (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubAgenda = onSnapshot(collection(db, 'weeklyAgenda'), (snapshot) => {
      setAgendaItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubTasks();
      unsubNotes();
      unsubAgenda();
    };
  }, []);

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

  // Filter voor vandaag & herhalende taken
  function getTodayTasks() {
    const result = { ochtend: [], middag: [], avond: [] };
    allTasks.forEach(task => {
      const block = task.timeBlock || 'ochtend';
      // Herhalend: bepaal of deze vandaag ook geldt
      if (
        task.date === today ||
        (task.repeat === 'daily') ||
        (task.repeat === 'weekly' && dayjs(task.date).day() === dayjs(today).day() && dayjs(task.date).isSameOrBefore(today)) ||
        (task.repeat === 'monthly' && dayjs(task.date).date() === dayjs(today).date() && dayjs(task.date).isSameOrBefore(today)) ||
        (task.repeat === 'yearly' && dayjs(task.date).format('MM-DD') === dayjs(today).format('MM-DD') && dayjs(task.date).isSameOrBefore(today))
      ) {
        result[block].push(task);
      }
    });
    return result;
  }

  const toggleBlock = (block) => {
    setExpandedBlocks((prev) =>
      prev.includes(block) ? prev.filter((b) => b !== block) : [...prev, block]
    );
  };

  const toggleDoneTask = async (taskId, current) => {
    await updateDoc(doc(db, 'tasks', taskId), { done: !current });
  };

  const toggleNoteExpand = (id) => {
    setExpandedNotes(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

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

  const navTabs = [
    { id: 'vandaag', label: 'Vandaag', icon: '📅' },
    { id: 'agenda', label: 'Weekagenda', icon: '🗓' },
    { id: 'kennisbank', label: 'Kennisbank', icon: '📚' },
    { id: 'bestellen', label: 'Bestellen', icon: '🛒' },
  ];

  const todayBlocks = getTodayTasks();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 relative pb-24">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 shadow bg-white">
        <img
          src="https://23g-sharedhosting-grit-wordpress.s3.eu-west-1.amazonaws.com/wp-content/uploads/sites/13/2023/11/30093636/Logo_kort_wit.png"
          alt="Logo"
          className="h-10 bg-green-600 p-1 rounded"
        />
        <span className="text-sm font-medium text-gray-600">{currentTime}</span>
        <button className="text-sm text-red-600 font-semibold">Log uit</button>
      </div>

      {/* Main view */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Vandaag met tijdsblokken */}
        {view === 'vandaag' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Dagplanning {dayjs(today).format('dddd DD MMMM')}</h2>
            {['ochtend', 'middag', 'avond'].map(block => (
              <div key={block} className="mb-2 rounded-xl overflow-hidden border border-gray-200">
                <button
                  className={`w-full text-left px-4 py-3 font-semibold border-b ${expandedBlocks.includes(block) ? 'bg-green-600 text-white' : 'bg-white text-black'}`}
                  onClick={() => toggleBlock(block)}
                >
                  {block.charAt(0).toUpperCase() + block.slice(1)}
                </button>
                {expandedBlocks.includes(block) && (
                  <div className="bg-white p-4 space-y-3">
                    {todayBlocks[block].length > 0 ? todayBlocks[block].map(task => (
                      <div key={task.id} className="bg-white rounded-xl p-4 shadow flex items-start space-x-4 border border-gray-200">
                        <button
                          onClick={() => toggleDoneTask(task.id, task.done)}
                          className={`w-6 h-6 rounded-full border-2 mt-1 flex items-center justify-center ${task.done ? 'border-green-500 bg-green-500' : 'border-gray-400'}`}
                        >
                          {task.done && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </button>
                        <div>
                          <p className={`font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.text}</p>
                          {task.notes && <p className="text-sm text-gray-500 italic mt-1">{task.notes}</p>}
                        </div>
                      </div>
                    )) : <p className="text-sm italic text-gray-400">Geen taken voor dit blok.</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Weekagenda */}
        {view === 'agenda' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Weekagenda</h2>
            {agendaItems.length === 0 && <p className="text-sm italic text-gray-500">Geen agendapunten</p>}
            {agendaItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow border border-gray-200 mb-2">
                <div className="font-bold text-green-700">{item.title}</div>
                {item.description && <div className="text-sm text-gray-600">{item.description}</div>}
                <div className="text-xs text-gray-500 italic">{dayjs(item.date).format('dddd DD MMM YYYY')}{item.time ? ` • ${item.time}` : ''} {item.repeat && item.repeat !== 'none' ? `• ${item.repeat}` : ''}</div>
              </div>
            ))}
          </div>
        )}

        {/* Kennisbank */}
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

        {/* Bestellen */}
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

      {/* Bottom Nav */}
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
