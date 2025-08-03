"use client";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaBriefcase,
  FaTasks,
  FaChartLine,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import dynamic from "next/dynamic";
import { useInfoModalStore } from "../../store/useInfoModalStore";

// Dynamic import for AttendanceWidget
const AttendanceWidget = dynamic(
  () => import("../../components/ui/AttendanceWidget"),
  { ssr: false }
);

interface ProjectRequest {
  id: string;
  name: string;
  status?: string;
  createdAt: Timestamp;
}
interface Task {
  id: string;
  title: string;
  isComplete: boolean;
  requestId: string;
  assignedTo: string;
  createdAt: Timestamp;
}

const SalesRepDashboard = () => {
  const { user, role } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<ProjectRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const { openModal } = useInfoModalStore();

  // Fetch leads and tasks
  useEffect(() => {
    if (!user || (role !== "sales_rep" && role !== "admin")) {
      router.replace("/dashboard");
      return;
    }

    // Fetch leads
    const leadsQuery = query(
      collection(db, "requests"),
      orderBy("createdAt", "desc")
    );
    const unsubscribeLeads = onSnapshot(
      leadsQuery,
      (snapshot) => {
        setLeads(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as ProjectRequest)
          )
        );
        if (loading) setLoading(false);
      },
      (error) => {
        openModal("Error", `Failed to fetch leads: ${error.message}`);
        setLoading(false);
      }
    );

    // Fetch tasks
    const tasksQuery = query(
      collection(db, "tasks"),
      where("assignedTo", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        setTasks(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Task))
        );
        if (loading) setLoading(false);
      },
      (error) => {
        openModal("Error", `Failed to fetch tasks: ${error.message}`);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeLeads();
      unsubscribeTasks();
    };
  }, [user, role, router, loading, openModal]);

  // Toggle task completion
  const handleToggleTask = useCallback(
    async (task: Task) => {
      const taskRef = doc(db, "tasks", task.id);
      try {
        await updateDoc(taskRef, { isComplete: !task.isComplete });
        openModal(
          "Success",
          `Task "${task.title}" marked as ${
            task.isComplete ? "incomplete" : "complete"
          }.`
        );
      } catch (error) {
        openModal(
          "Error",
          `Failed to update task: ${(error as Error).message}`
        );
      }
    },
    [openModal]
  );

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='flex items-center space-x-3'>
          <FaSpinner className='animate-spin text-blue-600' size={24} />
          <p className='text-gray-600 text-base'>Loading Sales Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Sticky Header */}
      <header className='sticky top-0 z-20 bg-white shadow-sm py-4 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
              Sales Dashboard
            </h1>
            <p className='text-sm sm:text-base text-gray-500 mt-1'>
              Manage your leads and tasks efficiently.
            </p>
          </div>
          <Link
            href='/admin/pipeline'
            className='inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <FaChartLine className='mr-2' />
            View Pipeline
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Attendance Widget */}
        <section className='mb-6'>
          <AttendanceWidget />
        </section>

        {/* Tasks and Leads */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* My Tasks Section */}
          <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg sm:text-xl font-semibold text-gray-900 flex items-center'>
                <FaTasks className='mr-2 text-green-600' /> My Tasks
              </h2>
              <button
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                className='text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'
              >
                {showCompletedTasks ? "Hide Completed" : "Show Completed"}
              </button>
            </div>
            <div className='space-y-3 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
              {tasks.filter((t) => (showCompletedTasks ? true : !t.isComplete))
                .length > 0 ? (
                tasks
                  .filter((t) => (showCompletedTasks ? true : !t.isComplete))
                  .map((task) => (
                    <div
                      key={task.id}
                      className='flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors'
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`mr-3 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          task.isComplete
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-300 hover:border-green-400"
                        }`}
                        aria-label={`Mark task "${task.title}" as ${
                          task.isComplete ? "incomplete" : "complete"
                        }`}
                      >
                        {task.isComplete && <FaCheck size={12} />}
                      </button>
                      <Link
                        href={`/dashboard/${task.requestId}`}
                        className='flex-grow text-gray-800 hover:underline text-sm sm:text-base truncate'
                        title={task.title}
                      >
                        {task.title}
                      </Link>
                    </div>
                  ))
              ) : (
                <p className='text-center text-gray-500 py-6 text-sm sm:text-base'>
                  {showCompletedTasks
                    ? "No tasks found."
                    : "No open tasks. Great job!"}
                </p>
              )}
            </div>
          </section>

          {/* Current Leads Section */}
          <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-900 flex items-center mb-4'>
              <FaBriefcase className='mr-2 text-blue-600' /> All Leads
            </h2>
            <div className='space-y-3 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <Link href={`/dashboard/${lead.id}`} key={lead.id}>
                    <div className='p-3 border rounded-md hover:bg-gray-100 transition-colors'>
                      <div className='flex justify-between items-center gap-2'>
                        <p
                          className='font-semibold text-gray-800 text-sm sm:text-base truncate'
                          title={lead.name}
                        >
                          {lead.name}
                        </p>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                            lead.status === "Project Approved"
                              ? "bg-green-100 text-green-800"
                              : lead.status === "Pending" || !lead.status
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {lead.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className='text-center text-gray-500 py-6 text-sm sm:text-base'>
                  No leads available.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SalesRepDashboard;
