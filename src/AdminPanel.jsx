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

  // Tasks
  const [allTasks, setAllTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [taskNote, setTaskNote] = useState('');
  const [taskDate, setTaskDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [taskPeriod, setTaskPeriod] = useState('ochtend');

  // Weekly Tasks
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [weeklyText, setWeeklyText] = useState('');
  const [weeklyNote, setWeeklyNote] = useState('');
  const [weeklyDate, setWeeklyDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [weeklyRepeat, setWeeklyRepeat] = useState('weekly');

  // Kennisbank
  const [kennisbank, setKennisbank] = useState([]);
  const [newTabTitle, setNewTabTitle] = useState('');
  const [newTabContent, setNewTabContent] = useState('');

  // Orders
  const [orders, setOrders] = useState([]);

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
      date: taskDate,
      period: taskPeriod
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
    if (!groups[task.date]) {
      groups[task.date] = { ochtend: [], middag: [], avond: [] };
    }
    if (groups[task.date][task.period]) {
      groups[task.date][task.period].push(task);
    }
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6">
      {/* ... other UI code remains unchanged ... */}

      {activeTab === 'day' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Nieuwe Dagtaak</h2>
          <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2" />
          <select value={taskPeriod} onChange={(e) => setTaskPeriod(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2">
            <option value="ochtend">Ochtend</option>
            <option value="middag">Middag</option>
            <option value="avond">Avond</option>
          </select>
          <input type="text" placeholder="Nieuwe taak" value={newTask} onChange={(e) => setNewTask(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2" />
          <input type="text" placeholder="Instructies" value={taskNote} onChange={(e) => setTaskNote(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2" />
          <button onClick={addTask} className="w-full bg-white text-black border border-gray-300 hover:border-green-500 py-2 rounded font-bold mb-4">Toevoegen</button>

          {Object.entries(groupedTasks).map(([date, periods]) => (
            <div key={date} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{dayjs(date).format('DD MMM YYYY')}</h3>
              {['ochtend', 'middag', 'avond'].map(period => (
                periods[period]?.length > 0 && (
                  <div key={period} className="mb-2">
                    <h4 className="text-md font-bold capitalize text-green-600">{period}</h4>
                    {periods[period].map(task => (
                      <div key={task.id} className="bg-white border border-gray-200 p-4 rounded my-1 flex justify-between items-center">
                        <div>
                          <p className={task.done ? 'line-through text-gray-400' : 'text-gray-800'}>{task.text}</p>
                          <small className="text-gray-500">{task.notes}</small>
                        </div>
                        <div className="space-x-2">
                          <button onClick={() => toggleDone(task.id, 'tasks', task.done)} className="text-sm px-3 py-1 rounded border border-gray-300 hover:border-green-500">{task.done ? 'Ongedaan' : 'Klaar'}</button>
                          <button onClick={() => deleteItem(task.id, 'tasks')} className="text-sm px-3 py-1 rounded border border-red-300 text-red-600 hover:border-red-600">Verwijder</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ... other tab content remains unchanged ... */}
    </div>
  );
}
