// Modernized AdminPanel.jsx with clean layout and consistent styling
import { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import app from './firebaseConfig';
import dayjs from 'dayjs';

const db = getFirestore(app);

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('day');

  const [allTasks, setAllTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [taskNote, setTaskNote] = useState('');
  const [taskDate, setTaskDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [weeklyText, setWeeklyText] = useState('');
  const [weeklyNote, setWeeklyNote] = useState('');
  const [weeklyDate, setWeeklyDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [weeklyRepeat, setWeeklyRepeat] = useState('weekly');

  const [kennisbank, setKennisbank] = useState([]);
  const [newTabTitle, setNewTabTitle] = useState('');
  const [newTabContent, setNewTabContent] = useState('');

  const [orders, setOrders] = useState([]);
  const [showArchivedOrders, setShowArchivedOrders] = useState(false);

  useEffect(() => {
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('date')), (snapshot) => {
      setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubWeekly = onSnapshot(collection(db, 'weeklyTasks'), (snapshot) => {
      setWeeklyTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubKennisbank = onSnapshot(collection(db, 'kennisbank'), (snapshot) => {
      setKennisbank(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubTasks();
      unsubWeekly();
      unsubKennisbank();
      unsubOrders();
    };
  }, []);

  const addTask = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'tasks'), {
      text: newTask,
      notes: taskNote,
      done: false,
      date: taskDate
    });
    setNewTask('');
    setTaskNote('');
  };

  const addWeeklyTask = async () => {
    if (!weeklyText.trim()) return;
    await addDoc(collection(db, 'weeklyTasks'), {
      text: weeklyText,
      notes: weeklyNote,
      done: false,
      date: weeklyDate,
      repeat: weeklyRepeat
    });
    setWeeklyText('');
    setWeeklyNote('');
  };

  const updateField = async (id, coll, field, value) => {
    await updateDoc(doc(db, coll, id), { [field]: value });
  };

  const addTab = async () => {
    if (!newTabTitle.trim()) return;
    await addDoc(collection(db, 'kennisbank'), {
      title: newTabTitle,
      content: newTabContent
    });
    setNewTabTitle('');
    setNewTabContent('');
  };

  const groupedTasks = allTasks.reduce((groups, task) => {
    if (!groups[task.date]) groups[task.date] = [];
    groups[task.date].push(task);
    return groups;
  }, {});

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded font-semibold transition ${activeTab === id ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">CarwashDash Admin</h1>
        <div className="space-x-2">
          <TabButton id="day" label="Dag Taken" />
          <TabButton id="week" label="Week Taken" />
          <TabButton id="notes" label="Kennisbank" />
          <TabButton id="orders" label="Bestellingen" />
          <TabButton id="overview" label="Overzicht" />
        </div>
      </div>

      {activeTab === 'day' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Nieuwe Dagtaak</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="p-2 rounded border" />
            <input type="text" placeholder="Taak" value={newTask} onChange={(e) => setNewTask(e.target.value)} className="p-2 rounded border" />
            <input type="text" placeholder="Instructies" value={taskNote} onChange={(e) => setTaskNote(e.target.value)} className="p-2 rounded border" />
          </div>
          <button onClick={addTask} className="bg-green-600 text-white px-4 py-2 rounded mb-6">Toevoegen</button>
          {Object.keys(groupedTasks).map(date => (
            <div key={date} className="mb-4">
              <h3 className="font-medium text-lg mb-1">{dayjs(date).format('DD MMM YYYY')}</h3>
              <div className="space-y-2">
                {groupedTasks[date].map(task => (
                  <div key={task.id} className="bg-white rounded shadow p-4 flex justify-between">
                    <div>
                      <p className={task.done ? 'line-through text-gray-400' : ''}>{task.text}</p>
                      <small className="text-gray-500">{task.notes}</small>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => updateField(task.id, 'tasks', 'done', !task.done)} className="bg-blue-500 text-white px-2 py-1 rounded">{task.done ? 'Ongedaan' : 'Klaar'}</button>
                      <button onClick={() => updateField(task.id, 'tasks', 'archived', true)} className="bg-yellow-500 text-white px-2 py-1 rounded">Archiveer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'week' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Nieuwe Weektaken</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <input type="date" value={weeklyDate} onChange={(e) => setWeeklyDate(e.target.value)} className="p-2 rounded border" />
            <select value={weeklyRepeat} onChange={(e) => setWeeklyRepeat(e.target.value)} className="p-2 rounded border">
              <option value="once">Eenmalig</option>
              <option value="daily">Dagelijks</option>
              <option value="weekly">Wekelijks</option>
              <option value="monthly">Maandelijks</option>
            </select>
            <input type="text" placeholder="Taak" value={weeklyText} onChange={(e) => setWeeklyText(e.target.value)} className="p-2 rounded border" />
            <input type="text" placeholder="Instructies" value={weeklyNote} onChange={(e) => setWeeklyNote(e.target.value)} className="p-2 rounded border" />
          </div>
          <button onClick={addWeeklyTask} className="bg-green-600 text-white px-4 py-2 rounded mb-6">Toevoegen</button>
          <div className="space-y-2">
            {weeklyTasks.map(task => (
              <div key={task.id} className="bg-white rounded shadow p-4 flex justify-between">
                <div>
                  <p className={task.done ? 'line-through text-gray-400' : ''}>{task.text}</p>
                  <small className="text-gray-500">{task.notes}</small><br />
                  <small className="italic text-gray-400">{task.date} • {task.repeat}</small>
                </div>
                <div className="space-x-2">
                  <button onClick={() => updateField(task.id, 'weeklyTasks', 'done', !task.done)} className="bg-blue-500 text-white px-2 py-1 rounded">{task.done ? 'Ongedaan' : 'Klaar'}</button>
                  <button onClick={() => updateField(task.id, 'weeklyTasks', 'archived', true)} className="bg-yellow-500 text-white px-2 py-1 rounded">Archiveer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Kennisbank</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder="Titel" value={newTabTitle} onChange={(e) => setNewTabTitle(e.target.value)} className="p-2 rounded border" />
            <textarea placeholder="Inhoud" value={newTabContent} onChange={(e) => setNewTabContent(e.target.value)} className="p-2 rounded border h-24"></textarea>
          </div>
          <button onClick={addTab} className="bg-green-600 text-white px-4 py-2 rounded mb-6">Toevoegen</button>
          <div className="space-y-2">
            {kennisbank.map(tab => (
              <div key={tab.id} className="bg-white rounded shadow p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{tab.title}</h3>
                  <button onClick={() => updateField(tab.id, 'kennisbank', 'archived', true)} className="bg-yellow-500 text-white px-2 py-1 rounded">Verwijder</button>
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{tab.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Aangevraagde Bestellingen</h2>
          <label className="block mb-4">
            <input
              type="checkbox"
              checked={showArchivedOrders}
              onChange={() => setShowArchivedOrders(!showArchivedOrders)}
              className="mr-2"
            /> Toon gearchiveerde bestellingen
          </label>
          <div className="space-y-2">
            {orders
              .filter(order => showArchivedOrders ? order.archived : !order.archived)
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(order => (
                <div key={order.id} className="bg-white rounded shadow p-4 flex justify-between">
                  <div>
                    <p className="font-bold capitalize">{order.type}</p>
                    <p>{order.text}</p>
                    <small className="italic">Voor: {order.target}</small>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => updateField(order.id, 'orders', 'done', !order.done)} className="bg-blue-500 text-white px-2 py-1 rounded">{order.done ? 'Ongedaan' : 'Klaar'}</button>
                    <button onClick={() => updateField(order.id, 'orders', 'archived', true)} className="bg-yellow-500 text-white px-2 py-1 rounded">Archiveer</button>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Overzicht / Analytics</h2>
          <p className="text-gray-500">(Later kunnen we hier grafieken of exports toevoegen.)</p>
        </div>
      )}
    </div>
  );
}
