// Modernized TabletView.jsx with clean layout, preserved functionality, and Carwash Kleiboer branding
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

export default function TabletView() {
  const [view, setView] = useState('home');
  const [todayTasks, setTodayTasks] = useState([
    { id: 1, text: 'Clean vacuum station', done: false, notes: 'Use blue cloth and disinfectant' },
    { id: 2, text: 'Restock vending machine', done: false, notes: 'Snacks and drinks as per list' },
  ]);

  const [weeklyTasks] = useState([
    { id: 1, text: 'Deep clean water system', notes: 'Refer to SOP binder section 4', date: '2025-05-06' },
  ]);

  const [generalNotes] = useState(
    'Welkom team! Vergeet niet vriendelijk te zijn tegen klanten. Bel de supervisor als er iets stuk is.'
  );

  const [orderForm, setOrderForm] = useState({ type: 'kleding', text: '', target: '' });
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

  const handleOrderChange = (field, value) => {
    setOrderForm({ ...orderForm, [field]: value });
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    alert('Bestelling verzonden!');
    setOrderForm({ type: 'kleding', text: '', target: '' });
  };

  const backgroundStyle = {
    backgroundImage: 'url(https://www.poste.sm/wp-content/uploads/2023/01/bg-1-poste.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };

  const Button = ({ label, onClick }) => (
    <button
      onClick={onClick}
      className="bg-green-500 text-white font-semibold py-8 px-4 rounded-xl shadow hover:bg-green-600 text-lg w-full"
    >
      {label}
    </button>
  );

  if (view === 'home') {
    return (
      <div className="min-h-screen text-white px-6 py-8" style={backgroundStyle}>
        <img
          src="https://23g-sharedhosting-grit-wordpress.s3.eu-west-1.amazonaws.com/wp-content/uploads/sites/13/2023/11/30093636/Logo_kort_wit.png"
          alt="Carwash Kleiboer wit logo"
          className="mx-auto h-20 mb-4"
        />
        <h1 className="text-center text-xl font-bold mb-6">{currentTime}</h1>
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
          <Button label="Vandaag" onClick={() => setView('today')} />
          <Button label="Weektaken" onClick={() => setView('week')} />
          <Button label="Kennisbank" onClick={() => setView('notes')} />
          <Button label="Bestellen" onClick={() => setView('order')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white px-4 py-6" style={backgroundStyle}>
      <button onClick={() => setView('home')} className="bg-white text-green-700 font-bold px-4 py-2 rounded mb-4">← Terug</button>
      <h1 className="text-2xl font-bold mb-4">CarwashDash</h1>

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
              <div key={task.id} className="bg-white text-black rounded-xl p-4">
                <p className="font-medium">{task.text}</p>
                <small className="text-xs text-gray-600">{task.notes} — {dayjs(task.date).format('dddd DD MMM')}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'notes' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Kennisbank</h2>
          <div className="bg-white text-black rounded-xl p-4">
            <p className="text-left whitespace-pre-wrap">{generalNotes}</p>
          </div>
        </div>
      )}

      {view === 'order' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Bestelformulier</h2>
          <form onSubmit={handleOrderSubmit} className="bg-white text-black p-4 rounded-xl space-y-4">
            <select value={orderForm.type} onChange={(e) => handleOrderChange('type', e.target.value)} className="w-full p-2 rounded">
              <option value="kleding">Kleding</option>
              <option value="onderdelen">Onderdelen</option>
              <option value="producten">Producten</option>
              <option value="overige">Overige</option>
            </select>
            <textarea
              className="w-full p-2 rounded"
              placeholder="Wat is nodig en hoeveel?"
              value={orderForm.text}
              onChange={(e) => handleOrderChange('text', e.target.value)}
              required
            ></textarea>
            <input
              type="text"
              className="w-full p-2 rounded"
              placeholder="Voor wie of waarvoor is het?"
              value={orderForm.target}
              onChange={(e) => handleOrderChange('target', e.target.value)}
              required
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full">Versturen</button>
          </form>
        </div>
      )}
    </div>
  );
}
