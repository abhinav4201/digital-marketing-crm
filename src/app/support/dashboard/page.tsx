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
import AttendanceWidget from "../../components/ui/AttendanceWidget";
import { LifeBuoy, Filter } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  userName: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  createdAt: Timestamp;
}

type TicketStatus = "All" | "Open" | "In Progress" | "Resolved" | "Closed";

const SupportDashboardPage = () => {
  const { role } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TicketStatus>("Open");

  useEffect(() => {
    if (role !== "support_agent" && role !== "admin") {
      setLoading(false);
      return;
    }

    let q;
    if (filter === "All") {
      q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    } else {
      q = query(
        collection(db, "tickets"),
        where("status", "==", filter),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ticket))
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role, filter]);

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

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading Support Dashboard...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 p-4 sm:p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900'>
            Support Dashboard
          </h1>
          <p className='text-gray-500 mt-2'>
            Manage and resolve all customer support tickets.
          </p>
        </header>

        <div className='mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-1'>
            <AttendanceWidget />
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-md'>
          <div className='p-6 flex justify-between items-center'>
            <h2 className='text-2xl font-semibold text-gray-900'>
              All Tickets
            </h2>
            <div className='flex items-center gap-2'>
              <Filter size={16} className='text-gray-500' />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as TicketStatus)}
                className='p-2 border rounded-md'
              >
                <option value='All'>All</option>
                <option value='Open'>Open</option>
                <option value='In Progress'>In Progress</option>
                <option value='Resolved'>Resolved</option>
                <option value='Closed'>Closed</option>
              </select>
            </div>
          </div>
          {loading ? (
            <p className='p-6'>Loading tickets...</p>
          ) : (
            <ul className='divide-y divide-gray-200'>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <li key={ticket.id} className='p-6 hover:bg-gray-50'>
                    <div className='flex justify-between items-center'>
                      <div>
                        <p className='font-semibold text-lg text-gray-800'>
                          {ticket.subject}
                        </p>
                        <p className='text-sm text-gray-600'>
                          User: {ticket.userName}
                        </p>
                      </div>
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
                  <p className='mt-2'>No tickets found for this filter.</p>
                </div>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportDashboardPage;
