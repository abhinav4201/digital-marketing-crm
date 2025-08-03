/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from "firebase/firestore";
import { useInfoModalStore } from "../../store/useInfoModalStore";
import { LogIn, LogOut } from "lucide-react";

interface AttendanceRecord {
  id: string;
  clockInTime: Timestamp;
  clockOutTime: Timestamp | null;
}

const AttendanceWidget = () => {
  // THE FIX: Import `loading` from the auth context
  const { user, loading: authLoading } = useAuth();
  const { openModal: openInfoModal } = useInfoModalStore();
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // THE FIX: Do not run the effect until the main AuthProvider is done loading.
    if (authLoading) {
      return;
    }

    if (!user) {
      setAttendance(null);
      setWidgetLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "attendance"),
      where("userId", "==", user.uid),
      where("date", "==", Timestamp.fromDate(today))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setAttendance({ id: doc.id, ...doc.data() } as AttendanceRecord);
      } else {
        setAttendance(null);
      }
      setWidgetLoading(false);
    });

    return () => unsubscribe();
    // THE FIX: Add `authLoading` to the dependency array.
  }, [user, authLoading]);

  const handleClockIn = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/attendance/clock-in", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      openInfoModal(
        "Success",
        `Clocked in at ${new Date(data.clockInTime).toLocaleTimeString()}`
      );
    } catch (error: any) {
      openInfoModal("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/attendance/clock-out", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      openInfoModal(
        "Success",
        `Clocked out at ${new Date(data.clockOutTime).toLocaleTimeString()}`
      );
    } catch (error: any) {
      openInfoModal("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (widgetLoading)
    return <div className='p-4 text-center'>Loading attendance...</div>;

  return (
    <div className='bg-white p-6 rounded-lg shadow-md'>
      <h3 className='font-bold text-lg text-gray-800'>My Attendance</h3>
      <div className='mt-4 text-center'>
        {attendance ? (
          <div>
            <p className='text-green-600 font-semibold'>
              Clocked In at:{" "}
              {new Date(attendance.clockInTime.toDate()).toLocaleTimeString()}
            </p>
            {attendance.clockOutTime ? (
              <p className='mt-2 text-red-600 font-semibold'>
                Clocked Out at:{" "}
                {new Date(
                  attendance.clockOutTime.toDate()
                ).toLocaleTimeString()}
              </p>
            ) : (
              <button
                onClick={handleClockOut}
                disabled={isSubmitting}
                className='mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 flex items-center justify-center'
              >
                <LogOut className='mr-2' size={18} />
                {isSubmitting ? "Processing..." : "Clock Out"}
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className='text-gray-500'>You have not clocked in today.</p>
            <button
              onClick={handleClockIn}
              disabled={isSubmitting}
              className='mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 flex items-center justify-center'
            >
              <LogIn className='mr-2' size={18} />
              {isSubmitting ? "Processing..." : "Clock In"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceWidget;
