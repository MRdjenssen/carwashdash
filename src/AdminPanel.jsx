import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import app from "./firebaseConfig";
import dayjs from "dayjs";
import AdminLogin from './AdminLogin'; // <-- IMPORT AdminLogin

const db = getFirestore(app);
const auth = getAuth(app);

const periodTabs = [
  { id: "daily", label: "Dagelijks" },
  { id: "weekly", label: "Wekelijks" },
  { id: "bimonthly", label: "Tweewekelijks" },
  { id: "monthly", label: "Maandelijks" },
  { id: "yearly", label: "Jaarlijks" },
];
const dayBlocks = ["ochtend", "middag", "avond"];
const kennisbankCategoriesDefault = ["Algemeen", "Materiaal", "Personeel"];

export default function AdminPanel() {
  // --- AUTH ---
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (userAuth) => {
      setUser(userAuth);
      setChecking(false);
    });
    return unsub;
  }, []);

  // --- NAVIGATION ---
  const [activePage, setActivePage] = useState("day");

  // --- TASKS ---
  const [tasks, setTasks] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState({
    text: "",
    notes: "",
    date: dayjs().format("YYYY-MM-DD"),
    timeBlock: "ochtend",
    repeat: "daily"
  });

  // --- AGENDA ---
  const [agenda, setAgenda] = useState([]);
  const [agendaForm, setAgendaForm] = useState({
    title: "",
    date: dayjs().format("YYYY-MM-DD")
  });
  const [showAgendaModal, setShowAgendaModal] = useState(false);

  // --- KENNISBANK ---
  const [kennisbank, setKennisbank] = useState([]);
  const [kennisbankCategories, setKennisbankCategories] = useState(kennisbankCategoriesDefault);
  const [selectedKennisbankCat, setSelectedKennisbankCat] = useState(kennisbankCategoriesDefault[0]);
  const [addKennisModal, setAddKennisModal] = useState(false);
  const [kennisForm, setKennisForm] = useState({
    title: "",
    content: "",
    category: kennisbankCategoriesDefault[0],
  });

  // --- ORDERS ---
  const [orders, setOrders] = useState([]);

  // --- LOAD DATA ---
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "tasks"), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "weeklyAgenda"), (snap) => {
      setAgenda(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "kennisbank"), (snap) => {
      setKennisbank(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      const cats = new Set(kennisbankCategoriesDefault);
      snap.docs.forEach(d => d.data().category && cats.add(d.data().category));
      setKennisbankCategories(Array.from(cats));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  // --- GROUP TASKS ---
  const groupedTasks = {};
  for (let tab of periodTabs) {
    groupedTasks[tab.id] = { ochtend: [], middag: [], avond: [] };
  }
  if (user) {
    tasks.forEach(task => {
      if (groupedTasks[task.repeat]) {
        const block = task.timeBlock || "ochtend";
        groupedTasks[task.repeat][block].push(task);
      }
    });
  }

  // --- TASK HANDLERS ---
  const openAddTask = () => {
    setTaskForm({
      text: "",
      notes: "",
      date: dayjs().format("YYYY-MM-DD"),
      timeBlock: "ochtend",
      repeat: selectedPeriod
    });
    setAddTaskModal(true);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskForm.text) return;
    setTaskSubmitting(true);
    try {
      await addDoc(collection(db, "tasks"), {
        ...taskForm,
        done: false,
      });
      setAddTaskModal(false);
    } catch (err) {
      alert("Fout bij opslaan: " + err.message);
    }
    setTaskSubmitting(false);
  };

  const handleDeleteTask = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "tasks", id));
  };

  // --- AGENDA HANDLERS ---
  const openAddAgenda = (date) => {
    setAgendaForm({
      title: "",
      date: date || dayjs().format("YYYY-MM-DD")
    });
    setShowAgendaModal(true);
  };

  const handleAddAgenda = async (e) => {
    e.preventDefault();
    if (!agendaForm.title || !user) return;
    await addDoc(collection(db, "weeklyAgenda"), {
      ...agendaForm
    });
    setShowAgendaModal(false);
  };

  const handleDeleteAgenda = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "weeklyAgenda", id));
  };

  function getAgendaOnDate(dateStr) {
    return user ? agenda.filter(a => a.date === dateStr) : [];
  }

  // --- KENNISBANK HANDLERS ---
  const openAddKennis = () => {
    setKennisForm({
      title: "",
      content: "",
      category: kennisbankCategories[0] || "Algemeen",
    });
    setAddKennisModal(true);
  };

  const handleAddKennis = async (e) => {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, "kennisbank"), {
      ...kennisForm,
    });
    setAddKennisModal(false);
  };

  const handleDeleteKennis = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "kennisbank", id));
  };

  // --- ORDERS ---
  const handleArchiveOrder = async (id, archived) => {
    if (!user) return;
    await updateDoc(doc(db, "orders", id), { archived: !archived });
  };

  if (checking) {
    return <div className="p-10">Bezig met inloggen...</div>;
  }

  // ** THIS IS THE KEY CHANGE **
  // If not logged in, show the AdminLogin component.
  if (!user) {
    // The onLogin prop is not strictly necessary anymore since we use
    // onAuthStateChanged to detect the login, but it can be kept for clarity.
    return <AdminLogin onLogin={() => {}} />;
  }

  // If user is logged in, show the full Admin Panel UI.
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-green-700 text-white flex flex-col">
        <div className="px-6 py-8 flex items-center gap-2">
          <img
            src="https://23g-sharedhosting-grit-wordpress.s3.eu-west-1.amazonaws.com/wp-content/uploads/sites/13/2023/11/30093636/Logo_kort_wit.png"
            alt="Logo"
            className="h-10 rounded bg-white p-1"
          />
          <span className="font-bold text-xl">CarwashDash</span>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-2">
          <SidebarButton label="Dag Taken" icon="📅" active={activePage === "day"} onClick={() => setActivePage("day")} />
          <SidebarButton label="Agenda" icon="🗓️" active={activePage === "week"} onClick={() => setActivePage("week")} />
          <SidebarButton label="Kennisbank" icon="📚" active={activePage === "kennisbank"} onClick={() => setActivePage("kennisbank")} />
          <SidebarButton label="Bestellingen" icon="🛒" active={activePage === "orders"} onClick={() => setActivePage("orders")} />
          <SidebarButton label="Overzicht" icon="📊" active={activePage === "analytics"} onClick={() => setActivePage("analytics")} />
        </nav>
        <button
          className="mt-auto mb-6 mx-6 py-2 bg-white text-green-700 rounded font-semibold hover:bg-green-100"
          onClick={() => signOut(auth)}
        >
          Log uit
        </button>
      </aside>

      <main className="flex-1 px-10 py-8 overflow-y-auto">
        {activePage === "day" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Dag Taken</h2>
              <button className="bg-green-700 text-white px-4 py-2 rounded-xl shadow hover:bg-green-800 font-semibold"
                onClick={openAddTask}
              >
                + Nieuwe Taak
              </button>
            </div>
            <div className="flex gap-2 mb-6">
              {periodTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedPeriod(tab.id)}
                  className={`px-4 py-2 rounded-xl font-semibold ${selectedPeriod === tab.id ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dayBlocks.map(block => (
                <div key={block} className="bg-white shadow rounded-2xl p-5">
                  <h3 className="font-bold mb-3 capitalize">{block}</h3>
                  <div className="flex flex-col gap-3">
                    {groupedTasks[selectedPeriod][block].length === 0 && (
                      <div className="text-gray-400 text-sm">Geen taken.</div>
                    )}
                    {groupedTasks[selectedPeriod][block].map(task => (
                      <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{task.text}</div>
                          <div className="text-xs text-gray-400">{task.notes}</div>
                          <div className="text-xs text-gray-500">{periodTabs.find(pt => pt.id === task.repeat)?.label}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-red-600 border px-2 py-1 rounded hover:bg-red-50" onClick={() => handleDeleteTask(task.id)}>Verwijder</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {addTaskModal && (
              <Modal onClose={() => setAddTaskModal(false)}>
                <form onSubmit={handleAddTask} className="space-y-3">
                  <h2 className="text-lg font-bold mb-2">Nieuwe Taak</h2>
                  <input className="w-full p-2 border rounded" required placeholder="Taak" value={taskForm.text} onChange={e => setTaskForm(f => ({ ...f, text: e.target.value }))} />
                  <input className="w-full p-2 border rounded" placeholder="Instructies/notities" value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} />
                  <input className="w-full p-2 border rounded" type="date" value={taskForm.date} onChange={e => setTaskForm(f => ({ ...f, date: e.target.value }))} />
                  <select className="w-full p-2 border rounded" value={taskForm.timeBlock} onChange={e => setTaskForm(f => ({ ...f, timeBlock: e.target.value }))}>
                    {dayBlocks.map(b => <option value={b} key={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                  </select>
                  <select className="w-full p-2 border rounded" value={taskForm.repeat} onChange={e => setTaskForm(f => ({ ...f, repeat: e.target.value }))}>
                    {periodTabs.map(t => <option value={t.id} key={t.id}>{t.label}</option>)}
                  </select>
                  <button
                    type="submit"
                    className="w-full py-2 bg-green-700 text-white rounded font-semibold"
                    disabled={taskSubmitting}
                  >
                    {taskSubmitting ? "Toevoegen..." : "Toevoegen"}
                  </button>
                </form>
              </Modal>
            )}
          </section>
        )}

        {activePage === "week" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Agenda</h2>
            </div>
            <div className="bg-white rounded-2xl shadow p-8 mb-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {[...Array(28)].map((_, idx) => {
                  const dateStr = dayjs().date(idx + 1).format("YYYY-MM-DD");
                  const items = getAgendaOnDate(dateStr);
                  return (
                    <div
                      key={idx}
                      className="h-16 flex flex-col items-center justify-center border border-gray-200 rounded hover:bg-green-50 cursor-pointer group"
                      onClick={() => openAddAgenda(dateStr)}
                    >
                      <span className="font-bold">{idx + 1}</span>
                      {items.map((a, i) => (
                        <span key={i} className="text-xs mt-1 px-2 py-1 rounded bg-green-200 text-green-900">{a.title}</span>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="text-sm text-gray-400">Klik op een datum om een agenda-item toe te voegen of te wijzigen.</div>
            </div>
            <div className="space-y-4">
              {agenda.sort((a, b) => a.date.localeCompare(b.date)).map(item => (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow flex justify-between items-center border border-gray-100">
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.date}</div>
                  </div>
                  <button className="text-red-600 border px-2 py-1 rounded hover:bg-red-50" onClick={() => handleDeleteAgenda(item.id)}>Verwijder</button>
                </div>
              ))}
            </div>
            {showAgendaModal && (
              <Modal onClose={() => setShowAgendaModal(false)}>
                <form onSubmit={handleAddAgenda} className="space-y-3">
                  <h2 className="text-lg font-bold mb-2">Nieuw Agenda-item</h2>
                  <input className="w-full p-2 border rounded" required placeholder="Titel" value={agendaForm.title} onChange={e => setAgendaForm(f => ({ ...f, title: e.target.value }))} />
                  <input className="w-full p-2 border rounded" type="date" value={agendaForm.date} onChange={e => setAgendaForm(f => ({ ...f, date: e.target.value }))} />
                  <button className="w-full py-2 bg-green-700 text-white rounded font-semibold">Toevoegen</button>
                </form>
              </Modal>
            )}
          </section>
        )}

        {activePage === "kennisbank" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Kennisbank</h2>
              <button className="bg-green-700 text-white px-4 py-2 rounded-xl shadow hover:bg-green-800 font-semibold"
                onClick={openAddKennis}
              >
                + Nieuw Artikel
              </button>
            </div>
            <div className="flex gap-3 mb-4">
              {kennisbankCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedKennisbankCat(cat)}
                  className={`px-4 py-2 rounded-full ${selectedKennisbankCat === cat ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div>
              {kennisbank.filter(k => k.category === selectedKennisbankCat).map(tab => (
                <div key={tab.id} className="bg-white border border-gray-200 p-6 rounded mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">{tab.title}</div>
                      <div className="text-gray-500 text-sm mb-2">Categorie: {tab.category}</div>
                      <div className="mb-3 whitespace-pre-line">{tab.content}</div>
                    </div>
                    <div>
                      <button className="text-red-600 border px-3 py-1 rounded hover:bg-red-50" onClick={() => handleDeleteKennis(tab.id)}>Verwijder</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {addKennisModal && (
              <Modal onClose={() => setAddKennisModal(false)}>
                <form onSubmit={handleAddKennis} className="space-y-3">
                  <h2 className="text-lg font-bold mb-2">Nieuw Artikel</h2>
                  <input className="w-full p-2 border rounded" required placeholder="Titel" value={kennisForm.title} onChange={e => setKennisForm(f => ({ ...f, title: e.target.value }))} />
                  <textarea className="w-full p-2 border rounded" required placeholder="Inhoud" value={kennisForm.content} onChange={e => setKennisForm(f => ({ ...f, content: e.target.value }))} />
                  <select className="w-full p-2 border rounded" value={kennisForm.category} onChange={e => setKennisForm(f => ({ ...f, category: e.target.value }))}>
                    {kennisbankCategories.map(c => <option value={c} key={c}>{c}</option>)}
                  </select>
                  <button className="w-full py-2 bg-green-700 text-white rounded font-semibold">Toevoegen</button>
                </form>
              </Modal>
            )}
          </section>
        )}

        {activePage === "orders" && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Aangevraagde Bestellingen</h2>
            {orders.length === 0 && <p className="text-gray-500 italic">Geen bestellingen gevonden.</p>}
            {orders.map(order => (
              <div key={order.id} className="bg-white border border-gray-200 p-6 rounded mb-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{order.type?.toUpperCase?.() ?? 'Onbekend'}</div>
                  <div>{order.text}</div>
                  <div className="text-xs text-gray-500 italic">Voor: {order.target}</div>
                </div>
                <button
                  onClick={() => handleArchiveOrder(order.id, order.archived)}
                  className={`text-sm px-3 py-1 rounded border ${order.archived ? 'border-green-400 text-green-600' : 'border-gray-300 text-black hover:border-green-600'}`}
                >
                  {order.archived ? 'Gearchiveerd' : 'Archiveer'}
                </button>
              </div>
            ))}
          </section>
        )}

        {activePage === "analytics" && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Overzicht & Analytics</h2>
            <div className="bg-white rounded-2xl p-10 shadow text-gray-400">
              Later toe te voegen: statistieken, exports, enz.
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SidebarButton({ label, icon, active, ...props }) {
  return (
    <button
      {...props}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium transition
        ${active ? "bg-white text-green-700" : "hover:bg-green-600/50"}
      `}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center">
      <div className="relative bg-white p-6 rounded-xl shadow-xl min-w-[320px] max-w-full">
        <button
          type="button"
          className="absolute top-3 right-3 text-2xl"
          onClick={onClose}
          tabIndex={0}
        >×</button>
        {children}
      </div>
    </div>
  );
}