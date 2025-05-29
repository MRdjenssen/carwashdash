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
  const [taskTimeOfDay, setTaskTimeOfDay] = useState('ochtend');

  // Weekly Agenda
  const [weeklyAgenda, setWeeklyAgenda] = useState([]);
  const [agendaText, setAgendaText] = useState('');
  const [agendaDate, setAgendaDate] = useState(dayjs().format('YYYY-MM-DD'));

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
    const unsubAgenda = onSnapshot(query(collection(db, 'weeklyAgenda'), orderBy('date')), (snapshot) => {
      setWeeklyAgenda(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubKennisbank = onSnapshot(collection(db, 'kennisbank'), (snapshot) => {
      setKennisbank(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTasks();
      unsubAgenda();
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
      timeOfDay: taskTimeOfDay
    });
    setNewTask('');
    setTaskNote('');
  };

  const addAgendaItem = async () => {
    if (!agendaText.trim()) return;
    await addDoc(collection(db, 'weeklyAgenda'), {
      text: agendaText,
      date: agendaDate
    });
    setAgendaText('');
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
    const date = task.date;
    if (!groups[date]) groups[date] = { ochtend: [], middag: [], avond: [] };
    groups[date][task.timeOfDay || 'ochtend'].push(task);
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
        <button onClick={() => setActiveTab('day')} className={`px-4 py-2 rounded ${activeTab === 'day' ? 'bg-green-600 text-white' : 'bg-white border border-gray-300'}`}>Dag Taken</button>
        <button onClick={() => setActiveTab('agenda')} className={`px-4 py-2 rounded ${activeTab === 'agenda' ? 'bg-green-600 text-white' : 'bg-white border border-gray-300'}`}>Week Agenda</button>
        <button onClick={() => setActiveTab('notes')} className={`px-4 py-2 rounded ${activeTab === 'notes' ? 'bg-green-600 text-white' : 'bg-white border border-gray-300'}`}>Kennisbank</button>
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded ${activeTab === 'orders' ? 'bg-green-600 text-white' : 'bg-white border border-gray-300'}`}>Bestellingen</button>
      </div>

      {activeTab === 'day' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Nieuwe Dagtaak</h2>
          <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2" />
          <select value={taskTimeOfDay} onChange={(e) => setTaskTimeOfDay(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2">
            <option value="ochtend">Ochtend</option>
            <option value="middag">Middag</option>
            <option value="avond">Avond</option>
          </select>
          <input type="text" placeholder="Nieuwe taak" value={newTask} onChange={(e) => setNewTask(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2" />
          <input type="text" placeholder="Instructies" value={taskNote} onChange={(e) => setTaskNote(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2" />
          <button onClick={addTask} className="w-full bg-white text-black border border-gray-300 hover:border-green-500 py-2 rounded font-bold mb-4">Toevoegen</button>
          {Object.keys(groupedTasks).map(date => (
            <div key={date} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{dayjs(date).format('DD MMM YYYY')}</h3>
              {['ochtend','middag','avond'].map(period => (
                <div key={period} className="mb-2">
                  <h4 className="font-semibold capitalize">{period}</h4>
                  {groupedTasks[date][period].map(task => (
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
              ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'agenda' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Weekagenda</h2>
          <input type="date" value={agendaDate} onChange={(e) => setAgendaDate(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2" />
          <input type="text" placeholder="Agendapunt" value={agendaText} onChange={(e) => setAgendaText(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2" />
          <button onClick={addAgendaItem} className="w-full bg-white text-black border border-gray-300 hover:border-green-500 py-2 rounded font-bold mb-4">Toevoegen</button>
          {weeklyAgenda.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 p-4 rounded mb-2">
              <h4 className="text-gray-800 font-medium">{item.text}</h4>
              <small className="text-gray-500 italic">{item.date}</small>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'notes' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Kennisbank</h2>
          <input type="text" placeholder="Titel" value={newTabTitle} onChange={(e) => setNewTabTitle(e.target.value)} className="p-2 border border-gray-300 rounded w-full mb-2" />
          <textarea placeholder="Inhoud" value={newTabContent} onChange={(e) => setNewTabContent(e.target.value)} className="p-2 border border-gray-300 rounded w-full h-24 mb-2" />
          <button onClick={addTab} className="w-full bg-white text-black border border-gray-300 hover:border-green-500 py-2 rounded font-bold mb-4">Toevoegen</button>
          {kennisbank.map(tab => (
            <div key={tab.id} className="bg-white border border-gray-200 p-4 rounded mb-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">{tab.title}</h3>
                <button onClick={() => deleteItem(tab.id, 'kennisbank')} className="text-sm px-3 py-1 rounded border border-red-300 text-red-600 hover:border-red-600">Verwijder</button>
              </div>
              <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{tab.content}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Aangevraagde Bestellingen</h2>
          {orders.length === 0 && <p className="text-sm italic text-gray-500">Geen bestellingen gevonden.</p>}
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-gray-200 p-4 rounded mb-2 flex justify-between items-center">
              <div>
                <p className="font-bold">{order.type.toUpperCase()}</p>
                <p>{order.text}</p>
                <p className="text-sm text-gray-500 italic">Voor: {order.target}</p>
              </div>
              <button
                onClick={() => toggleArchive(order.id, order.archived)}
                className={`text-sm px-3 py-1 rounded border ${order.archived ? 'border-green-400 text-green-600' : 'border-gray-300 text-black hover:border-green-600'}`}
              >
                {order.archived ? 'Gearchiveerd' : 'Archiveer'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
