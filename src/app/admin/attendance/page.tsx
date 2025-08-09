/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  where,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  doc,
  getDoc,
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot, // Import QuerySnapshot type
} from "firebase/firestore";
import { Clock } from "lucide-react";

interface AttendanceRecord {
  id: string;
  userName: string;
  userId: string;
  date: Timestamp;
  clockInTime: Timestamp;
  clockOutTime: Timestamp | null;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

const PAGE_SIZE = 15;

const AttendanceReportPage = () => {
  const { role } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Pagination state
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(true);

  // FIX: Added explicit types for snapshot and document parameters
  const fetchRecords = useCallback((q: any) => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      q,
      async (snapshot: QuerySnapshot<DocumentData>) => {
        const fetchedRecords = await Promise.all(
          snapshot.docs.map(async (d: QueryDocumentSnapshot<DocumentData>) => {
            const attendanceData = d.data();
            let userShift = { shiftStartTime: "N/A", shiftEndTime: "N/A" };

            if (attendanceData.userId) {
              const userDocRef = doc(db, "users", attendanceData.userId);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userShift = {
                  shiftStartTime: userData.shiftStartTime || "N/A",
                  shiftEndTime: userData.shiftEndTime || "N/A",
                };
              }
            }

            // FIX: Construct the object without spreading a typed object, avoiding overwrite errors.
            return {
              id: d.id,
              userName: attendanceData.userName,
              userId: attendanceData.userId,
              date: attendanceData.date,
              clockInTime: attendanceData.clockInTime,
              clockOutTime: attendanceData.clockOutTime,
              ...userShift,
            } as AttendanceRecord;
          })
        );

        setRecords(fetchedRecords);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setFirstVisible(snapshot.docs[0] || null);
        setIsNextPageAvailable(snapshot.size === PAGE_SIZE);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      return;
    }
    setPage(1);
    const startOfDay = new Date(filterDate);
    startOfDay.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "attendance"),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where(
        "date",
        "<",
        Timestamp.fromDate(new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000))
      ),
      orderBy("date", "desc"),
      limit(PAGE_SIZE)
    );

    const unsubscribe = fetchRecords(q);
    return () => unsubscribe();
  }, [role, filterDate, fetchRecords]);

  const fetchNextPage = () => {
    if (!lastVisible) return;
    const startOfDay = new Date(filterDate);
    startOfDay.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, "attendance"),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where(
        "date",
        "<",
        Timestamp.fromDate(new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000))
      ),
      orderBy("date", "desc"),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );
    fetchRecords(q);
    setPage((p) => p + 1);
  };

  const fetchPrevPage = () => {
    if (!firstVisible) return;
    const startOfDay = new Date(filterDate);
    startOfDay.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, "attendance"),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where(
        "date",
        "<",
        Timestamp.fromDate(new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000))
      ),
      orderBy("date", "desc"),
      endBefore(firstVisible),
      limitToLast(PAGE_SIZE)
    );
    fetchRecords(q);
    setPage((p) => p - 1);
  };

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

  if (loading && records.length === 0) {
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
                    Shift Time
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
                      {rec.shiftStartTime} - {rec.shiftEndTime}
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
            {records.length === 0 && !loading && (
              <div className='text-center text-gray-500 py-12'>
                <Clock className='mx-auto h-12 w-12 text-gray-400' />
                <p className='mt-2'>
                  No attendance records found for the selected date.
                </p>
              </div>
            )}
          </div>
          {/* Pagination Controls */}
          <div className='bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6'>
            <button
              onClick={fetchPrevPage}
              disabled={page <= 1}
              className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Previous
            </button>
            <span className='text-sm text-gray-500'>Page {page}</span>
            <button
              onClick={fetchNextPage}
              disabled={!isNextPageAvailable}
              className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportPage;
