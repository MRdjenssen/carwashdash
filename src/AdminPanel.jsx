// AdminPanel.jsx – modernized UI with full functionality and branding
import { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
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

  useEffect(() => {
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('date')), snapshot => {
      setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubWeekly = onSnapshot(collection(db, 'weeklyTasks'), snapshot => {
      setWeeklyTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubKennisbank = onSnapshot(collection(db, 'kennisbank'), snapshot => {
      setKennisbank(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubOrders = onSnapshot(collection(db, 'orders'), snapshot => {
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

  const deleteItem = async (id, coll) => {
    await deleteDoc(doc(db, coll, id));
  };

  const toggleDone = async (id, coll, current) => {
    await updateDoc(doc(db, coll, id), { done: !current });
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

  const toggleArchiveOrder = async (id, current) => {
    await updateDoc(doc(db, 'orders', id), { archived: !current });
  };

  const groupedTasks = allTasks.reduce((groups, task) => {
    if (!groups[task.date]) groups[task.date] = [];
    groups[task.date].push(task);
    return groups;
  }, {});

  const navButton = (key, label) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === key ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6">CarwashDash Admin Panel</h1>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {navButton('day', 'Dag Taken')}
        {navButton('week', 'Week Taken')}
        {navButton('notes', 'Kennisbank')}
        {navButton('orders', 'Aangevraagde Bestellingen')}
      </div>

      {/* Daily Tasks */}
      {activeTab === 'day' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Nieuwe Dagtaak</h2>
          <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full" />
          <input type="text" placeholder="Nieuwe taak" value={newTask} onChange={e => setNewTask(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full" />
          <input type="text" placeholder="Instructies" value={taskNote} onChange={e => setTaskNote(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full" />
          <button onClick={addTask} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full">Toevoegen</button>
          {Object.keys(groupedTasks).map(date => (
            <div key={date} className="mt-4">
              <h3 className="text-lg font-semibold mb-2">{dayjs(date).format('DD MMM YYYY')}</h3>
              <div className="space-y-2">
                {groupedTasks[date].map(task => (
                  <div key={task.id} className="bg-gray-800 p-4 rounded-xl flex justify-between items-start">
                    <div>
                      <p className={task.done ? 'line-through text-gray-400' : ''}>{task.text}</p>
                      <p className="text-sm text-gray-500 italic">{task.notes}</p>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => toggleDone(task.id, 'tasks', task.done)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">{task.done ? 'Ongedaan' : 'Klaar'}</button>
                      <button onClick={() => deleteItem(task.id, 'tasks')} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Verwijder</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Tasks */}
      {activeTab === 'week' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Nieuwe Weektaken</h2>
          <input type="date" value={weeklyDate} onChange={e => setWeeklyDate(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full" />
          <select value={weeklyRepeat} onChange={e => setWeeklyRepeat(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full">
            <option value="once">Eenmalig</option>
            <option value="daily">Dagelijks</option>
            <option value="weekly">Wekelijks</option>
            <option value="monthly">Maandelijks</option>
          </select>
          <input type="text" placeholder="Nieuwe taak" value={weeklyText} onChange={e => setWeeklyText(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full" />
          <input type="text" placeholder="Instructies" value={weeklyNote} onChange={e => setWeeklyNote(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full" />
          <button onClick={addWeeklyTask} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full">Toevoegen</button>
          <div className="space-y-2">
            {weeklyTasks.map(task => (
              <div key={task.id} className="bg-gray-800 p-4 rounded-xl flex justify-between items-start">
                <div>
                  <p className={task.done ? 'line-through text-gray-400' : ''}>{task.text}</p>
                  <p className="text-sm text-gray-400 italic">{task.notes}</p>
                  <p className="text-xs text-gray-500">{task.date} • {task.repeat}</p>
                </div>
                <div className="space-x-2">
                  <button onClick={() => toggleDone(task.id, 'weeklyTasks', task.done)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">{task.done ? 'Ongedaan' : 'Klaar'}</button>
                  <button onClick={() => deleteItem(task.id, 'weeklyTasks')} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Verwijder</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kennisbank */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Kennisbank</h2>
          <input type="text" placeholder="Titel" value={newTabTitle} onChange={e => setNewTabTitle(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full" />
          <textarea placeholder="Inhoud" value={newTabContent} onChange={e => setNewTabContent(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full h-24" />
          <button onClick={addTab} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full">Toevoegen</button>
          {kennisbank.map(tab => (
            <div key={tab.id} className="bg-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{tab.title}</h3>
                <button onClick={() => deleteItem(tab.id, 'kennisbank')} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Verwijder</button>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap mt-2">{tab.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Aangevraagde Bestellingen</h2>
          {orders.map(order => (
            <div key={order.id} className={`p-4 rounded-xl ${order.archived ? 'bg-gray-700' : 'bg-gray-800'} flex justify-between items-start`}>
              <div>
                <p><strong>Categorie:</strong> {order.type}</p>
                <p><strong>Inhoud:</strong> {order.text}</p>
                <p><strong>Doel:</strong> {order.target}</p>
              </div>
              <button onClick={() => toggleArchiveOrder(order.id, order.archived)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                {order.archived ? 'Heropen' : 'Archiveer'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
