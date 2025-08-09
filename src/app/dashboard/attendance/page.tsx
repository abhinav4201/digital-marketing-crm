"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import Link from "next/link";

interface AttendanceRecord {
  id: string;
  clockInTime: Timestamp;
  clockOutTime: Timestamp | null;
}

const AttendanceAnalyticsPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalDaysPresent: 0,
    totalHours: 0,
    avgClockIn: "",
    avgClockOut: "",
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const q = query(
      collection(db, "attendance"),
      where("userId", "==", user.uid),
      where("date", ">=", Timestamp.fromDate(startOfMonth)),
      where("date", "<=", Timestamp.fromDate(endOfMonth)),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord)
      );
      setRecords(fetchedRecords);

      // Calculate Analytics
      const totalDaysPresent = fetchedRecords.length;
      let totalMillis = 0;
      let totalClockInTime = 0;
      let totalClockOutTime = 0;
      let clockOutCount = 0;

      fetchedRecords.forEach((record) => {
        if (record.clockOutTime) {
          totalMillis +=
            record.clockOutTime.toMillis() - record.clockInTime.toMillis();

          const clockIn = record.clockInTime.toDate();
          totalClockInTime +=
            clockIn.getHours() * 3600 +
            clockIn.getMinutes() * 60 +
            clockIn.getSeconds();

          const clockOut = record.clockOutTime.toDate();
          totalClockOutTime +=
            clockOut.getHours() * 3600 +
            clockOut.getMinutes() * 60 +
            clockOut.getSeconds();
          clockOutCount++;
        }
      });

      const avgClockInSeconds =
        totalDaysPresent > 0 ? totalClockInTime / totalDaysPresent : 0;
      const avgClockOutSeconds =
        clockOutCount > 0 ? totalClockOutTime / clockOutCount : 0;

      setAnalytics({
        totalDaysPresent,
        totalHours: totalMillis / (1000 * 60 * 60),
        avgClockIn: new Date(avgClockInSeconds * 1000)
          .toISOString()
          .substr(11, 8),
        avgClockOut: new Date(avgClockOutSeconds * 1000)
          .toISOString()
          .substr(11, 8),
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        Loading analytics...
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 p-4 sm:p-8'>
      <div className='max-w-4xl mx-auto'>
        <header className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900'>
            My Attendance Report
          </h1>
          <p className='text-gray-500 mt-2'>Your monthly work shift summary.</p>
        </header>

        {/* Analytics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h3 className='text-lg font-semibold text-gray-700'>
              Days Present
            </h3>
            <p className='text-3xl font-bold text-blue-600'>
              {analytics.totalDaysPresent}
            </p>
          </div>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h3 className='text-lg font-semibold text-gray-700'>Total Hours</h3>
            <p className='text-3xl font-bold text-green-600'>
              {analytics.totalHours.toFixed(2)}
            </p>
          </div>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h3 className='text-lg font-semibold text-gray-700'>
              Avg. Clock In
            </h3>
            <p className='text-3xl font-bold text-cyan-600'>
              {analytics.avgClockIn}
            </p>
          </div>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h3 className='text-lg font-semibold text-gray-700'>
              Avg. Clock Out
            </h3>
            <p className='text-3xl font-bold text-red-600'>
              {analytics.avgClockOut}
            </p>
          </div>
        </div>

        {/* Detailed Log Table */}
        <div className='bg-white rounded-lg shadow-md'>
          <div className='p-6'>
            <h2 className='text-2xl font-semibold text-gray-800'>Daily Log</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Clock In
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Clock Out
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {record.clockInTime.toDate().toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-green-600'>
                      {record.clockInTime.toDate().toLocaleTimeString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-red-600'>
                      {record.clockOutTime
                        ? record.clockOutTime.toDate().toLocaleTimeString()
                        : "N/A"}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap font-semibold'>
                      {record.clockOutTime
                        ? `${(
                            (record.clockOutTime.toMillis() -
                              record.clockInTime.toMillis()) /
                            (1000 * 60 * 60)
                          ).toFixed(2)} hours`
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className='text-center mt-8'>
          <Link
            href='/sales/dashboard'
            className='text-blue-600 hover:underline'
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAnalyticsPage;
