// AdminPanel.jsx with tab layout
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

  // Daily Tasks
  const [allTasks, setAllTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [taskNote, setTaskNote] = useState('');
  const [taskDate, setTaskDate] = useState(dayjs().format('YYYY-MM-DD'));

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
    return () => {
      unsubTasks();
      unsubWeekly();
      unsubKennisbank();
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

  const groupedTasks = allTasks.reduce((groups, task) => {
    if (!groups[task.date]) groups[task.date] = [];
    groups[task.date].push(task);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">CarwashDash Admin Panel</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button onClick={() => setActiveTab('day')} className={`px-4 py-2 rounded ${activeTab === 'day' ? 'bg-green-600' : 'bg-gray-700'}`}>Dag Taken</button>
        <button onClick={() => setActiveTab('week')} className={`px-4 py-2 rounded ${activeTab === 'week' ? 'bg-green-600' : 'bg-gray-700'}`}>Week Taken</button>
        <button onClick={() => setActiveTab('notes')} className={`px-4 py-2 rounded ${activeTab === 'notes' ? 'bg-green-600' : 'bg-gray-700'}`}>Kennisbank</button>
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded ${activeTab === 'overview' ? 'bg-green-600' : 'bg-gray-700'}`}>Overzicht</button>
      </div>

      {/* Tab Content */}
      {activeTab === 'day' && (
        <>
          <h2 className="text-xl font-semibold mb-2">Nieuwe Dagtaak</h2>
          <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="p-2 bg-gray-800 rounded text-white mb-2" />
          <input type="text" placeholder="Nieuwe taak" value={newTask} onChange={(e) => setNewTask(e.target.value)} className="p-2 rounded text-black w-full mb-2" />
          <input type="text" placeholder="Instructies" value={taskNote} onChange={(e) => setTaskNote(e.target.value)} className="p-2 rounded text-black w-full mb-2" />
          <button onClick={addTask} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full mb-6">Toevoegen</button>
          {Object.keys(groupedTasks).map(date => (
            <div key={date} className="mb-6">
              <h3 className="text-lg font-semibold">{dayjs(date).format('DD MMM YYYY')}</h3>
              {groupedTasks[date].map(task => (
                <div key={task.id} className="bg-gray-800 p-4 rounded my-2 flex justify-between">
                  <div>
                    <p className={task.done ? 'line-through text-gray-400' : ''}>{task.text}</p>
                    <small className="text-gray-500">{task.notes}</small>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => toggleDone(task.id, 'tasks', task.done)} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">{task.done ? 'Ongedaan' : 'Klaar'}</button>
                    <button onClick={() => deleteItem(task.id, 'tasks')} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded">Verwijder</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {activeTab === 'week' && (
        <>
          <h2 className="text-xl font-semibold mb-2">Nieuwe Weektaken</h2>
          <input type="date" value={weeklyDate} onChange={(e) => setWeeklyDate(e.target.value)} className="p-2 bg-gray-800 rounded text-white mb-2" />
          <select value={weeklyRepeat} onChange={(e) => setWeeklyRepeat(e.target.value)} className="p-2 bg-gray-800 text-white rounded w-full mb-2">
            <option value="once">Eenmalig</option>
            <option value="daily">Dagelijks</option>
            <option value="weekly">Wekelijks</option>
            <option value="monthly">Maandelijks</option>
          </select>
          <input type="text" placeholder="Nieuwe taak" value={weeklyText} onChange={(e) => setWeeklyText(e.target.value)} className="p-2 rounded text-black w-full mb-2" />
          <input type="text" placeholder="Instructies" value={weeklyNote} onChange={(e) => setWeeklyNote(e.target.value)} className="p-2 rounded text-black w-full mb-2" />
          <button onClick={addWeeklyTask} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full mb-6">Toevoegen</button>
          {weeklyTasks.map(task => (
            <div key={task.id} className="bg-gray-800 p-4 rounded mb-2 flex justify-between">
              <div>
                <p className={task.done ? 'line-through text-gray-400' : ''}>{task.text}</p>
                <small className="text-gray-400">{task.notes}</small><br />
                <small className="text-gray-500 italic">{task.date} • {task.repeat}</small>
              </div>
              <div className="space-x-2">
                <button onClick={() => toggleDone(task.id, 'weeklyTasks', task.done)} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">{task.done ? 'Ongedaan' : 'Klaar'}</button>
                <button onClick={() => deleteItem(task.id, 'weeklyTasks')} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded">Verwijder</button>
              </div>
            </div>
          ))}
        </>
      )}

      {activeTab === 'notes' && (
        <>
          <h2 className="text-xl font-semibold mb-2">Kennisbank Tabs</h2>
          <input type="text" placeholder="Titel" value={newTabTitle} onChange={(e) => setNewTabTitle(e.target.value)} className="p-2 rounded text-black w-full mb-2" />
          <textarea placeholder="Inhoud" value={newTabContent} onChange={(e) => setNewTabContent(e.target.value)} className="p-2 rounded text-black w-full h-24 mb-2" />
          <button onClick={addTab} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full mb-6">Toevoegen</button>
          {kennisbank.map(tab => (
            <div key={tab.id} className="bg-gray-800 p-4 rounded mb-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{tab.title}</h3>
                <button onClick={() => deleteItem(tab.id, 'kennisbank')} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded">Verwijder</button>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap mt-2">{tab.content}</p>
            </div>
          ))}
        </>
      )}

      {activeTab === 'overview' && (
        <>
          <h2 className="text-xl font-semibold mb-2">Overzicht / Analytics</h2>
          <p className="text-gray-400">(Hier kunnen we later statistieken of exports tonen.)</p>
        </>
      )}
    </div>
  );
}
