/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { useInfoModalStore } from "../../store/useInfoModalStore";
import { PlusCircle, LifeBuoy } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  createdAt: Timestamp;
}

const MyTicketsPage = () => {
  const { user } = useAuth();
  const { openModal: openInfoModal } = useInfoModalStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "Medium",
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "tickets"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket))
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmitTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(newTicket),
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error || "Failed to create ticket."
        );
      openInfoModal("Success", "Your support ticket has been submitted.");
      setNewTicket({ subject: "", description: "", priority: "Medium" });
    } catch (error: any) {
      openInfoModal("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 p-4 sm:p-8'>
      <div className='max-w-4xl mx-auto'>
        <header className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900'>
            My Support Tickets
          </h1>
          <p className='text-gray-500 mt-2'>
            Track your support requests and create new ones.
          </p>
        </header>

        {/* Create Ticket Form */}
        <div className='bg-white p-6 rounded-lg shadow-md mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Submit a New Ticket
          </h2>
          <form onSubmit={handleSubmitTicket} className='space-y-4'>
            <div>
              <label
                htmlFor='subject'
                className='block text-sm font-medium text-gray-700'
              >
                Subject
              </label>
              <input
                type='text'
                id='subject'
                value={newTicket.subject}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, subject: e.target.value })
                }
                required
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2'
              />
            </div>
            <div>
              <label
                htmlFor='priority'
                className='block text-sm font-medium text-gray-700'
              >
                Priority
              </label>
              <select
                id='priority'
                value={newTicket.priority}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, priority: e.target.value })
                }
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2'
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label
                htmlFor='description'
                className='block text-sm font-medium text-gray-700'
              >
                Description
              </label>
              <textarea
                id='description'
                rows={5}
                value={newTicket.description}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, description: e.target.value })
                }
                required
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2'
              />
            </div>
            <button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 flex items-center justify-center'
            >
              <PlusCircle className='mr-2' size={20} />
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>

        {/* List of Existing Tickets */}
        <div className='bg-white rounded-lg shadow-md'>
          <div className='p-6'>
            <h2 className='text-2xl font-semibold text-gray-900'>
              Ticket History
            </h2>
          </div>
          {loading ? (
            <p className='p-6'>Loading tickets...</p>
          ) : (
            <ul className='divide-y divide-gray-200'>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <li key={ticket.id} className='p-6 hover:bg-gray-50'>
                    <div className='flex justify-between items-center'>
                      <p className='font-semibold text-lg text-gray-800'>
                        {ticket.subject}
                      </p>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className='text-sm text-gray-500 mt-1'>
                      Created on:{" "}
                      {new Date(ticket.createdAt.toDate()).toLocaleDateString()}
                    </p>
                  </li>
                ))
              ) : (
                <div className='text-center text-gray-500 py-12'>
                  <LifeBuoy className='mx-auto h-12 w-12 text-gray-400' />
                  <p className='mt-2'>
                    You haven&apos;t submitted any support tickets yet.
                  </p>
                </div>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTicketsPage;
