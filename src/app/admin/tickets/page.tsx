/* eslint-disable @typescript-eslint/no-explicit-any */
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
  limit,
  startAfter,
  endBefore,
  limitToLast,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { useInfoModalStore } from "../../store/useInfoModalStore";
import { LifeBuoy } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  userName: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  createdAt: Timestamp;
}

type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

const PAGE_SIZE = 10;

const AdminTicketsPage = () => {
  const { user, role } = useAuth();
  const { openModal: openInfoModal } = useInfoModalStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(true);

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "tickets"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket))
      );
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setFirstVisible(snapshot.docs[0]);
      setIsNextPageAvailable(snapshot.size === PAGE_SIZE);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  const fetchNextPage = () => {
    if (!lastVisible || role !== "admin") return;
    setLoading(true);
    const q = query(
      collection(db, "tickets"),
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );
    onSnapshot(q, (snapshot) => {
      setTickets(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket))
      );
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setFirstVisible(snapshot.docs[0]);
      setIsNextPageAvailable(snapshot.size === PAGE_SIZE);
      setPage((p) => p + 1);
      setLoading(false);
    });
  };

  const fetchPrevPage = () => {
    if (!firstVisible || role !== "admin") return;
    setLoading(true);
    const q = query(
      collection(db, "tickets"),
      orderBy("createdAt", "desc"),
      endBefore(firstVisible),
      limitToLast(PAGE_SIZE)
    );
    onSnapshot(q, (snapshot) => {
      setTickets(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket))
      );
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setFirstVisible(snapshot.docs[0]);
      setIsNextPageAvailable(true);
      setPage((p) => p - 1);
      setLoading(false);
    });
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/tickets/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ ticketId, status }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error || "Failed to update status."
        );
      openInfoModal("Success", `Ticket status updated to ${status}.`);
    } catch (error: any) {
      openInfoModal("Error", error.message);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "border-red-500";
      case "Medium":
        return "border-yellow-500";
      case "Low":
        return "border-green-500";
      default:
        return "border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading tickets...</p>
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
            Support Ticket Dashboard
          </h1>
          <p className='text-gray-500 mt-2'>
            View and manage all user-submitted support tickets.
          </p>
        </header>

        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Subject
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    User
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Submitted
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`border-l-4 ${getPriorityColor(
                      ticket.priority
                    )}`}
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-semibold text-gray-900'>
                        {ticket.subject}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Priority: {ticket.priority}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                      {ticket.userName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {new Date(ticket.createdAt.toDate()).toLocaleString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          handleStatusChange(
                            ticket.id,
                            e.target.value as TicketStatus
                          )
                        }
                        className={`p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        <option value='Open'>Open</option>
                        <option value='In Progress'>In Progress</option>
                        <option value='Resolved'>Resolved</option>
                        <option value='Closed'>Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tickets.length === 0 && !loading && (
              <div className='text-center text-gray-500 py-12'>
                <LifeBuoy className='mx-auto h-12 w-12 text-gray-400' />
                <p className='mt-2'>
                  No support tickets have been submitted yet.
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

export default AdminTicketsPage;
