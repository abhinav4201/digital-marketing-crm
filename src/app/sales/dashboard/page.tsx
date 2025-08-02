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
} from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaBriefcase, FaTasks } from "react-icons/fa";

interface ProjectRequest {
  id: string;
  name: string;
  status?: string;
}
interface Task {
  id: string;
  title: string;
  isComplete: boolean;
  requestId: string;
}

const SalesRepDashboard = () => {
  const { user, role } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<ProjectRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (role !== "sales_rep" && role !== "admin")) {
      router.replace("/dashboard");
      return;
    }

    // Fetch all leads (could be filtered by assignedTo in the future)
    const leadsQuery = query(
      collection(db, "requests"),
      orderBy("createdAt", "desc")
    );
    const unsubscribeLeads = onSnapshot(leadsQuery, (snapshot) => {
      setLeads(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ProjectRequest)
        )
      );
      if (loading) setLoading(false);
    });

    // Fetch all tasks assigned to the current user
    const tasksQuery = query(
      collection(db, "tasks"),
      where("assignedTo", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Task))
      );
      if (loading) setLoading(false);
    });

    return () => {
      unsubscribeLeads();
      unsubscribeTasks();
    };
  }, [user, role, router, loading]);

  const handleToggleTask = async (task: Task) => {
    const taskRef = doc(db, "tasks", task.id);
    await updateDoc(taskRef, {
      isComplete: !task.isComplete,
    });
  };

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading Sales Dashboard...</p>
      </div>
    );

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-10'>
          <h1 className='text-4xl font-bold text-slate-900'>Sales Dashboard</h1>
          <p className='text-gray-500 mt-2'>
            Your central hub for managing leads and tasks.
          </p>
        </header>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* My Tasks Section */}
          <section>
            <h2 className='text-2xl font-bold text-slate-800 mb-4 flex items-center'>
              <FaTasks className='mr-3 text-green-600' /> My Open Tasks
            </h2>
            <div className='space-y-3 bg-white p-4 rounded-lg shadow-md max-h-[60vh] overflow-y-auto'>
              {tasks.filter((t) => !t.isComplete).length > 0 ? (
                tasks
                  .filter((t) => !t.isComplete)
                  .map((task) => (
                    <div
                      key={task.id}
                      className='flex items-center p-3 bg-gray-50 rounded-md'
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        className='mr-4 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0'
                      ></button>
                      <Link
                        href={`/dashboard/${task.requestId}`}
                        className='flex-grow hover:underline'
                      >
                        <p className='text-gray-800'>{task.title}</p>
                      </Link>
                    </div>
                  ))
              ) : (
                <p className='text-center text-gray-500 p-8'>
                  No open tasks. Great job!
                </p>
              )}
            </div>
          </section>

          {/* Current Leads Section */}
          <section>
            <h2 className='text-2xl font-bold text-slate-800 mb-4 flex items-center'>
              <FaBriefcase className='mr-3 text-blue-600' /> All Leads
            </h2>
            <div className='space-y-4 bg-white p-4 rounded-lg shadow-md max-h-[60vh] overflow-y-auto'>
              {leads.map((lead) => (
                <Link href={`/dashboard/${lead.id}`} key={lead.id}>
                  <div className='p-4 border rounded-md hover:bg-gray-50 transition-colors'>
                    <p className='font-semibold text-gray-800 truncate'>
                      {lead.name}
                    </p>
                    <p className='text-sm text-gray-500'>
                      Status: {lead.status || "Pending"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SalesRepDashboard;
