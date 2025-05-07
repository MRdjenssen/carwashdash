// AdminPanel.jsx with modern UI and 'bestellingen' archive
import { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  where,
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

  const toggleArchive = async (id, current) => {
    await updateDoc(doc(db, 'orders', id), { archived: !current });
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

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <img
          src="https://23g-sharedhosting-grit-wordpress.s3.eu-west-1.amazonaws.com/wp-content/uploads/sites/13/2023/11/30093636/Logo_kort_wit.png"
          alt="Logo"
          className="h-12 bg-green-600 p-1 rounded"
        />
        <h1 className="text-2xl font-bold">CarwashDash Admin</h1>
        <button className="text-sm font-medium text-red-500">Log uit</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {['day', 'week', 'notes', 'orders', 'overview'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${activeTab === tab ? 'bg-green-600 text-white' : 'bg-white border border-gray-300'}`}
          >
            {tab === 'day' ? 'Dag Taken' :
             tab === 'week' ? 'Week Taken' :
             tab === 'notes' ? 'Kennisbank' :
             tab === 'orders' ? 'Aangevraagde Bestellingen' :
             'Overzicht'}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Aangevraagde Bestellingen</h2>
          {orders.length === 0 && <p className="text-sm italic text-gray-500">Geen bestellingen gevonden.</p>}
          {orders.map(order => (
            <div key={order.id} className={`bg-white border ${order.archived ? 'border-gray-200' : 'border-gray-400'} p-4 rounded mb-2`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{order.type.toUpperCase()}</p>
                  <p className="text-gray-700">{order.text}</p>
                  <p className="text-sm text-gray-500 italic">Voor: {order.target}</p>
                </div>
                <button
                  onClick={() => toggleArchive(order.id, order.archived)}
                  className={`px-3 py-1 rounded border ${order.archived ? 'border-green-400 text-green-600' : 'border-gray-300 text-black hover:border-green-600'}`}
                >
                  {order.archived ? 'Gearchiveerd' : 'Archiveer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing tabs (day, week, notes, overview) stay here as previously updated */}
    </div>
  );
}
