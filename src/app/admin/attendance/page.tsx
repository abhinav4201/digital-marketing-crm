"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  where,
} from "firebase/firestore";
import { Clock } from "lucide-react";

interface AttendanceRecord {
  id: string;
  userName: string;
  date: Timestamp;
  clockInTime: Timestamp;
  clockOutTime: Timestamp | null;
}

const AttendanceReportPage = () => {
  const { role } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // Default to today

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      return;
    }

    // Firestore query based on the selected date
    const startOfDay = new Date(filterDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filterDate);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "attendance"),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where("date", "<=", Timestamp.fromDate(endOfDay)),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecords(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord)
        )
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role, filterDate]);

  const calculateDuration = (
    start: Timestamp,
    end: Timestamp | null
  ): string => {
    if (!end) return "N/A";
    const diffMs = end.toMillis() - start.toMillis();
    if (diffMs < 0) return "Error";
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading attendance records...</p>
      </div>
    );
  }
  if (role !== "admin") {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-red-500'>
          You are not authorized to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 p-4 sm:p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900'>
            Attendance Report
          </h1>
          <p className='text-gray-500 mt-2'>
            Monitor daily clock-in and clock-out records for your team.
          </p>
        </header>

        <div className='mb-6'>
          <label
            htmlFor='filterDate'
            className='block text-sm font-medium text-gray-700'
          >
            Filter by Date
          </label>
          <input
            type='date'
            id='filterDate'
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className='mt-1 block w-full md:w-1/3 border-gray-300 rounded-md shadow-sm p-2'
          />
        </div>

        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Employee
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Date
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Clock In
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Clock Out
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Total Hours
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {rec.userName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {new Date(rec.date.toDate()).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold'>
                      {new Date(rec.clockInTime.toDate()).toLocaleTimeString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold'>
                      {rec.clockOutTime
                        ? new Date(
                            rec.clockOutTime.toDate()
                          ).toLocaleTimeString()
                        : "Not Clocked Out"}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold'>
                      {calculateDuration(rec.clockInTime, rec.clockOutTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && (
              <div className='text-center text-gray-500 py-12'>
                <Clock className='mx-auto h-12 w-12 text-gray-400' />
                <p className='mt-2'>
                  No attendance records found for the selected date.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportPage;
