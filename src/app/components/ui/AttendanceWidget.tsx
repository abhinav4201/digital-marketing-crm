/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
  doc,
} from "firebase/firestore";
import { BarChart2, LogIn, LogOut, Coffee, Utensils, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "../../lib/firebase";
import { useAuth } from "../../providers/AuthProvider";
import { useInfoModalStore } from "../../store/useInfoModalStore";

// --- INTERFACES ---
interface UserProfile {
  displayName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
  teaBreakStart?: string;
  teaBreakEnd?: string;
}

interface Manager {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  clockInTime: Timestamp;
  clockOutTime: Timestamp | null;
  lunchBreakStartTime?: Timestamp;
  lunchBreakEndTime?: Timestamp;
  teaBreakStartTime?: Timestamp;
  teaBreakEndTime?: Timestamp;
  status: "working" | "on_lunch" | "on_tea";
}

// --- CONSTANTS ---
const INACTIVITY_TIMEOUT_MINUTES = 15;
const CONFIRMATION_TIMEOUT_SECONDS = 120; // 2 minutes

// --- HELPER FUNCTION ---
const timeStringToDate = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// --- JUSTIFICATION MODAL COMPONENT ---
const JustificationModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  managers,
}: any) => {
  const [reason, setReason] = useState("");
  const [manager, setManager] = useState("");

  const handleSubmit = () => {
    if (reason && manager) {
      onSubmit(reason, manager);
      setReason("");
      setManager("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-8 rounded-lg shadow-xl w-full max-w-md'>
        <h2 className='text-2xl font-bold mb-4'>{title}</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder='Please provide a reason...'
          className='w-full p-2 border rounded-md mb-4'
          rows={4}
        ></textarea>
        <select
          value={manager}
          onChange={(e) => setManager(e.target.value)}
          className='w-full p-2 border rounded-md mb-6'
        >
          <option value=''>Tag a Manager for Approval</option>
          {managers.map((m: Manager) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <div className='flex justify-end gap-4'>
          <button
            onClick={onClose}
            className='text-gray-600 font-bold py-2 px-4 rounded-lg'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || !manager}
            className='bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 flex items-center'
          >
            <Send className='mr-2' size={16} /> Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN WIDGET COMPONENT ---
const AttendanceWidget = () => {
  const { user, loading: authLoading } = useAuth();
  const { openModal: openInfoModal } = useInfoModalStore();

  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [justificationContext, setJustificationContext] = useState<any>(null);

  // Fetch user profile and managers
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) setUserProfile(docSnap.data() as UserProfile);
    });

    const managersQuery = query(
      collection(db, "users"),
      where("role", "in", ["admin", "sales_rep"])
    );
    const unsubManagers = onSnapshot(managersQuery, (snapshot) => {
      setManagers(
        snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              name: doc.data().displayName || doc.data().email,
            } as Manager)
        )
      );
    });

    return () => {
      unsubUser();
      unsubManagers();
    };
  }, [user]);

  // Fetch attendance data
  useEffect(() => {
    if (authLoading || !user) {
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
        setAttendance({
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        } as AttendanceRecord);
      } else {
        setAttendance(null);
      }
      setWidgetLoading(false);
    });
    return () => unsubscribe();
  }, [user, authLoading]);

  const submitJustification = async (reason: string, managerId: string) => {
    if (!user || !attendance || !justificationContext) return;
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/attendance/request-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          attendanceId: attendance.id,
          type: justificationContext.type,
          reason,
          managerId,
        }),
      });

      if (justificationContext.type === "overtime") {
        await handleClockOut(true);
      } else if (justificationContext.type.startsWith("extended")) {
        await handleBreak(justificationContext.breakType, "end", true);
      }

      openInfoModal("Success", "Justification submitted for approval.");
    } catch (error: any) {
      openInfoModal("Error", error.message);
    } finally {
      setIsSubmitting(false);
      setShowJustificationModal(false);
    }
  };

  const handleClockOut = useCallback(
    async (bypassJustification = false) => {
      if (!user) return;

      const now = new Date();
      const shiftEnd = userProfile?.shiftEndTime
        ? timeStringToDate(userProfile.shiftEndTime)
        : null;

      if (shiftEnd && now > shiftEnd && !bypassJustification) {
        setJustificationContext({
          type: "overtime",
          title: "Overtime Justification",
        });
        setShowJustificationModal(true);
        return;
      }

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
        setShowInactivityModal(false);
        if (confirmationTimerRef.current)
          clearTimeout(confirmationTimerRef.current);
      }
    },
    [user, userProfile, openInfoModal]
  );

  const handleBreak = useCallback(
    async (
      breakType: "lunch" | "tea",
      action: "start" | "end",
      bypassJustification = false
    ) => {
      if (!user || !attendance) return;

      if (action === "end" && !bypassJustification) {
        const breakStartTime =
          attendance?.[
            breakType === "lunch" ? "lunchBreakStartTime" : "teaBreakStartTime"
          ]?.toDate();
        const scheduledEndTimeStr =
          userProfile?.[
            breakType === "lunch" ? "lunchBreakEnd" : "teaBreakEnd"
          ];

        if (breakStartTime && scheduledEndTimeStr) {
          const now = new Date();
          const scheduledEnd = timeStringToDate(scheduledEndTimeStr);
          if (now > scheduledEnd) {
            setJustificationContext({
              type: `extended_${breakType}`,
              title: `Extended ${
                breakType.charAt(0).toUpperCase() + breakType.slice(1)
              } Break`,
              breakType,
            });
            setShowJustificationModal(true);
            return;
          }
        }
      }

      setIsSubmitting(true);
      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/attendance/break", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            attendanceId: attendance.id,
            breakType,
            action,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        openInfoModal(
          "Success",
          `You have successfully ${action}ed your ${breakType} break.`
        );
      } catch (error: any) {
        openInfoModal("Error", error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, attendance, userProfile, openInfoModal]
  );

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (confirmationTimerRef.current)
      clearTimeout(confirmationTimerRef.current);
    setShowInactivityModal(false);

    if (
      attendance &&
      !attendance.clockOutTime &&
      attendance.status === "working"
    ) {
      inactivityTimerRef.current = setTimeout(() => {
        setShowInactivityModal(true);
        confirmationTimerRef.current = setTimeout(
          handleClockOut,
          CONFIRMATION_TIMEOUT_SECONDS * 1000
        );
      }, INACTIVITY_TIMEOUT_MINUTES * 60 * 1000);
    }
  }, [handleClockOut, attendance]);

  useEffect(() => {
    if (attendance && !attendance.clockOutTime) {
      window.addEventListener("mousemove", resetInactivityTimer);
      window.addEventListener("keydown", resetInactivityTimer);
      resetInactivityTimer();
    }

    return () => {
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (confirmationTimerRef.current)
        clearTimeout(confirmationTimerRef.current);
    };
  }, [attendance, resetInactivityTimer]);

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

  if (widgetLoading) {
    return <div className='p-4 text-center'>Loading attendance...</div>;
  }

  const isWorking = attendance && !attendance.clockOutTime;
  const isOnLunch = isWorking && attendance.status === "on_lunch";
  const isOnTea = isWorking && attendance.status === "on_tea";

  return (
    <>
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
                  onClick={() => handleClockOut()}
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

        {isWorking && (
          <div className='mt-4 border-t pt-4 space-y-2'>
            <div className='grid grid-cols-2 gap-2'>
              <button
                onClick={() =>
                  handleBreak("lunch", isOnLunch ? "end" : "start")
                }
                disabled={isSubmitting || !!isOnTea}
                className={`w-full flex items-center justify-center font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 ${
                  isOnLunch
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <Utensils className='mr-2' size={18} />
                {isOnLunch ? "End Lunch" : "Start Lunch"}
              </button>
              <button
                onClick={() => handleBreak("tea", isOnTea ? "end" : "start")}
                disabled={isSubmitting || !!isOnLunch}
                className={`w-full flex items-center justify-center font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 ${
                  isOnTea
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <Coffee className='mr-2' size={18} />
                {isOnTea ? "End Tea" : "Start Tea"}
              </button>
            </div>
          </div>
        )}

        <div className='mt-4 text-center border-t pt-4'>
          <Link
            href='/dashboard/attendance'
            className='text-blue-600 hover:underline text-sm font-semibold flex items-center justify-center'
          >
            <BarChart2 className='mr-2' size={16} />
            View Full Report
          </Link>
        </div>
      </div>

      <JustificationModal
        isOpen={showJustificationModal}
        onClose={() => setShowJustificationModal(false)}
        onSubmit={submitJustification}
        title={justificationContext?.title}
        managers={managers}
      />

      {showInactivityModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-8 rounded-lg shadow-xl text-center'>
            <h2 className='text-2xl font-bold mb-4'>Are you still there?</h2>
            <p className='text-gray-600 mb-6'>
              We noticed you&apos;ve been inactive. You will be automatically clocked
              out if you don&apos;t respond.
            </p>
            <button
              onClick={resetInactivityTimer}
              className='bg-blue-600 text-white font-bold py-2 px-6 rounded-lg'
            >
              I&apos;m still here
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceWidget;
