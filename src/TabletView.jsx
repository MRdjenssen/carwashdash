// React + Tailwind demo of CarwashDash Tablet View with full custom branding and live clock

import { useState, useEffect } from 'react';

export default function TabletView() {
  const [view, setView] = useState('home');
  const [todayTasks, setTodayTasks] = useState([
    { id: 1, text: 'Clean vacuum station', done: false, notes: 'Use blue cloth and disinfectant' },
    { id: 2, text: 'Restock vending machine', done: false, notes: 'Snacks and drinks as per list' },
  ]);

  const [weeklyTasks] = useState([
    { id: 1, text: 'Deep clean water system', notes: 'Refer to SOP binder section 4' },
  ]);

  const [generalNotes] = useState(
    'Welkom team! Vergeet niet vriendelijk te zijn tegen klanten. Bel de supervisor als er iets stuk is.'
  );

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date().toLocaleString('nl-NL', {
        timeZone: 'Europe/Amsterdam',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(now);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleTask = (taskId) => {
    setTodayTasks(
      todayTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );
  };

  const backgroundStyle = {
    backgroundImage: 'url(https://www.poste.sm/wp-content/uploads/2023/01/bg-1-poste.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };

  if (view === 'home') {
    return (
      <div
        className="min-h-screen text-white p-6 font-sans text-center"
        style={backgroundStyle}
      >
        <img
          src="https://23g-sharedhosting-grit-wordpress.s3.eu-west-1.amazonaws.com/wp-content/uploads/sites/13/2023/11/30093636/Logo_kort_wit.png"
          alt="Carwash Kleiboer wit logo"
          className="mx-auto h-20 mb-6"
        />
        <h1 className="text-2xl font-bold mb-4">{currentTime}</h1>
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
          <button
            onClick={() => setView('today')}
            className="bg-green-500 text-white font-bold py-10 rounded-2xl text-xl shadow-lg hover:bg-green-600"
          >
            Vandaag
          </button>
          <button
            onClick={() => setView('week')}
            className="bg-green-500 text-white font-bold py-10 rounded-2xl text-xl shadow-lg hover:bg-green-600"
          >
            Weektaken
          </button>
          <button
            onClick={() => setView('notes')}
            className="bg-green-500 text-white font-bold py-10 rounded-2xl text-xl shadow-lg hover:bg-green-600"
          >
            Kennisbank
          </button>
          <button
            onClick={() => setView('sales')}
            className="bg-green-500 text-white font-bold py-10 rounded-2xl text-xl shadow-lg hover:bg-green-600"
          >
            Verkoop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-4 text-center font-sans" style={backgroundStyle}>
      <button onClick={() => setView('home')} className="absolute top-4 left-4 bg-white text-green-700 font-bold px-4 py-2 rounded">← Menu</button>
      <h1 className="text-3xl font-bold mb-4">CarwashDash</h1>

      {view === 'today' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Taken voor Vandaag</h2>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div key={task.id} className="bg-white text-black rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className={task.done ? 'line-through text-gray-500' : ''}>{task.text}</p>
                  <small className="text-xs text-gray-600">{task.notes}</small>
                </div>
                <button
                  onClick={() => toggleTask(task.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  {task.done ? 'Ongedaan' : 'Klaar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Speciale Weektaken</h2>
          <div className="space-y-2">
            {weeklyTasks.map((task) => (
              <div key={task.id} className="bg-white text-black rounded-xl p--4">
                <p className="font-medium">{task.text}</p>
                <small className="text-xs text-gray-600">{task.notes}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'notes' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Algemene Kennisbank</h2>
          <div className="bg-white text-black rounded-xl p-4">
            <p className="text-left whitespace-pre-wrap">{generalNotes}</p>
          </div>
        </div>
      )}

      {view === 'sales' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Live Verkoop Dashboard</h2>
          <iframe
            src="https://carwashkleiboer.carwash-cms.com/management/Dashboard"
            className="w-full h-[500px] border rounded-xl"
            title="Sales Dashboard"
          ></iframe>
        </div>
      )}
    </div>
  );
}
