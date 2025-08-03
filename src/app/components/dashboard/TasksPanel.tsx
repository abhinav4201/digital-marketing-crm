/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect, FormEvent } from "react";
import { useAuth, UserRole } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  where,
} from "firebase/firestore";
import { useInfoModalStore } from "../../store/useInfoModalStore";
import { Plus, Check } from "lucide-react";

interface Task {
  id: string;
  title: string;
  isComplete: boolean;
  createdAt: Timestamp;
  assignedTo: string;
}

export default function TasksPanel({ requestId }: { requestId: string }) {
  const { user, role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { openModal: openInfoModal } = useInfoModalStore();

  useEffect(() => {
    if (role !== "admin") return;
    const q = query(
      collection(db, "users"),
      where("role", "in", ["admin", "sales_rep"])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().displayName || doc.data().email,
        }))
      );
    });
    return () => unsubscribe();
  }, [role]);

  useEffect(() => {
    if (!requestId) return;
    const q = query(
      collection(db, "tasks"),
      where("requestId", "==", requestId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Task))
      );
    });
    return () => unsubscribe();
  }, [requestId]);

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !assignedTo || !user) {
      openInfoModal(
        "Error",
        "Please provide a title and assign the task to a user."
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ requestId, title: newTaskTitle, assignedTo }),
      });
      setNewTaskTitle("");
      setAssignedTo("");
    } catch (error) {
      openInfoModal("Error", "Could not add the task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/tasks/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          requestId,
          taskId: task.id,
          isComplete: !task.isComplete,
        }),
      });
    } catch (error) {
      openInfoModal("Error", "Could not update task status.");
    }
  };

  if (role !== "admin" && role !== "sales_rep") return null;

  return (
    <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
      <h2 className='text-2xl font-semibold mb-4 text-gray-900'>
        Project Tasks
      </h2>
      {role === "admin" && (
        <form
          onSubmit={handleAddTask}
          className='space-y-4 mb-6 p-4 border rounded-lg'
        >
          <div className='flex gap-4'>
            <input
              type='text'
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder='New task title...'
              className='flex-grow border-gray-300 rounded-md shadow-sm p-2'
            />
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className='border-gray-300 rounded-md shadow-sm p-2'
            >
              <option value=''>Assign to...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg disabled:bg-gray-400 flex items-center justify-center'
          >
            <Plus size={20} className='mr-2' /> Add Task
          </button>
        </form>
      )}
      <div className='space-y-3'>
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center p-3 rounded-md transition-colors ${
              task.isComplete
                ? "bg-green-50 text-gray-500 line-through"
                : "bg-gray-50"
            }`}
          >
            <button
              onClick={() => handleToggleTask(task)}
              disabled={user?.uid !== task.assignedTo && role !== "admin"}
              className={`mr-4 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 disabled:opacity-50 ${
                task.isComplete
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300"
              }`}
            >
              {task.isComplete && <Check size={16} className='text-white' />}
            </button>
            <span className='flex-grow'>{task.title}</span>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className='text-center text-gray-400 py-4'>
            No tasks for this project yet.
          </p>
        )}
      </div>
    </div>
  );
}
