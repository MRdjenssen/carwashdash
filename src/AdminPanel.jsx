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

  if (!user) {
    return <div className="p-10 text-red-600">Niet ingelogd. Log eerst in als admin.</div>;
  }

  // If user is logged in, show the simplified test view for now.
  // All hooks above are defined and will run.
  return (
    <div className="p-10">
      <h1>Admin Panel - Testing Reintroduction (Build Test)</h1>
      <p>If you see this, login was successful, the app BUILT correctly, and all original hooks have been defined.</p>
      <p>User ID: {user.uid}</p>
      <button
        className="mt-6 py-2 px-4 bg-white text-green-700 rounded font-semibold hover:bg-green-100 border border-green-700"
        onClick={() => signOut(auth)}
      >
        Log uit
      </button>
    </div>
  );

  /*
  // Original full JSX return statement - KEEP THIS COMMENTED OUT FOR NOW
  // We will uncomment this if the simple return above works without the React #310 error.

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
             ... content for day tasks ...
          </section>
        )}
        {activePage === "week" && (
          <section>
            ... content for agenda ...
          </section>
        )}
        {activePage === "kennisbank" && (
          <section>
            ... content for kennisbank ...
          </section>
        )}
        {activePage === "orders" && (
          <section>
            ... content for orders ...
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
  */
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