import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, query, where } from 'firebase/firestore';
import app from './firebaseConfig';
import dayjs from 'dayjs';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const db = getFirestore(app);

export default function CompletedTasks() {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const q = query(collection(db, 'tasks'), where('done', '==', true));
    const unsub = onSnapshot(q, (snapshot) => {
      setCompletedTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredTasks = completedTasks.filter(task => dayjs(task.date).isSame(selectedDate, 'day'));

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Completed Tasks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
          />
        </div>
        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div key={task.id} className="bg-white rounded-xl p-4 shadow flex justify-between items-center border border-gray-100">
                <div>
                  <div className="font-semibold">{task.text}</div>
                  <div className="text-xs text-gray-500">{dayjs(task.date).format('YYYY-MM-DD')}</div>
                </div>
              </div>
            ))
          ) : (
            <p>No tasks completed on this date.</p>
          )}
        </div>
      </div>
    </div>
  );
}
