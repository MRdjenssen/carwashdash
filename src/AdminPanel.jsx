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

// Remove storage/image logic for now to keep it simple

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
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) return <div className="p-10">Bezig met inloggen...</div>;
  if (!user) return <div className="p-10 text-red-600">Niet ingelogd. Log eerst in als admin.</div>;

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

  // --- LOAD DATA ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tasks"), (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  // --- GROUP TASKS ---
  const groupedTasks = {};
  for (let tab of periodTabs) {
    groupedTasks[tab.id] = { ochtend: [], middag: [], avond: [] };
  }
  tasks.forEach(task => {
    if (groupedTasks[task.repeat]) {
      const block = task.timeBlock || "ochtend";
      groupedTasks[task.repeat][block].push(task);
    }
  });

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
    await deleteDoc(doc(db, "tasks", id));
  };

  // ---- UI ----
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-green-700 text-white flex flex-col">
        <div className="px-6 py-8 flex items-center gap-2">
          <span className="font-bold text-xl">CarwashDash</span>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-2">
          <SidebarButton label="Dag Taken" icon="📅" active={activePage === "day"} onClick={() => setActivePage("day")} />
        </nav>
        <button
          className="mt-auto mb-6 mx-6 py-2 bg-white text-green-700 rounded font-semibold hover:bg-green-100"
          onClick={() => signOut(auth)}
        >
          Log uit
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-10 py-8 overflow-y-auto">
        {/* Dag Taken */}
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
            {/* Period tabs */}
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

            {/* Add Task Modal */}
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
      </main>
    </div>
  );
}

// Reusable sidebar button
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

// Simple modal overlay (with close button OUTSIDE the form)
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
