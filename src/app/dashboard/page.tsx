"use client";
import { useAuth } from "../providers/AuthProvider";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaBell, FaLifeRing, FaBriefcase } from "react-icons/fa";
import { useRouter } from "next/navigation";
import AttendanceWidget from "../components/ui/AttendanceWidget";

// Interface for Project Requests
interface ProjectRequest {
  id: string;
  message: string;
  createdAt: Timestamp;
  status?: string;
  lastUpdatedBy?: "user" | "admin";
}

// Interface for Support Tickets
interface SupportTicket {
  id: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  createdAt: Timestamp;
}

const DashboardPage = () => {
  const { user, role } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admins are redirected to the admin panel
    if (role === "admin") {
      router.replace("/admin");
      return;
    }

    if (user) {
      // Fetch Projects
      const projectsQuery = query(
        collection(db, "requests"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
        setRequests(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as ProjectRequest)
          )
        );
        setLoading(false);
      });

      // Fetch Tickets
      const ticketsQuery = query(
        collection(db, "tickets"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
        setTickets(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as SupportTicket)
          )
        );
      });

      return () => {
        unsubscribeProjects();
        unsubscribeTickets();
      };
    }
  }, [user, role, router]);

  const getStatusChipColor = (status?: string) => {
    switch (status) {
      case "Project Approved":
        return "bg-green-100 text-green-800";
      case "Quotation Sent":
        return "bg-blue-100 text-blue-800";
      case "Services Selected":
        return "bg-indigo-100 text-indigo-800";
      case "Revision Requested":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getTicketStatusColor = (status: string) => {
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
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <p className='text-text-secondary'>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background p-4 sm:p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-10'>
          <h1 className='text-4xl font-bold text-slate-900'>
            Welcome, {user?.displayName || user?.email}
          </h1>
          <p className='text-gray-500 mt-2'>
            This is your personal dashboard. View your projects and support
            tickets here.
          </p>
        </header>

        {/* **THE FIX IS HERE** */}
        {/* Conditionally render the AttendanceWidget only for specific roles */}
        {(role === "sales_rep" || role === "support_agent") && (
          <div className='mb-8'>
            <AttendanceWidget />
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* My Projects Section */}
          <section>
            <h2 className='text-2xl font-bold text-slate-800 mb-4 flex items-center'>
              <FaBriefcase className='mr-3 text-blue-600' /> My Projects
            </h2>
            <div className='space-y-4'>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <Link href={`/dashboard/${req.id}`} key={req.id}>
                    <div className='bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden'>
                      <div className='p-5'>
                        <div className='flex justify-between items-start'>
                          <p
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusChipColor(
                              req.status
                            )}`}
                          >
                            {req.status || "Service Selection Pending"}
                          </p>
                          {req.lastUpdatedBy === "admin" && (
                            <div className='flex items-center text-xs font-bold text-teal-600 animate-pulse'>
                              <FaBell className='mr-1' /> New Update
                            </div>
                          )}
                        </div>
                        <p className='text-lg font-bold text-slate-800 mt-4'>
                          Request from{" "}
                          {new Date(
                            req.createdAt?.toDate()
                          ).toLocaleDateString()}
                        </p>
                        <p className='text-sm text-gray-600 mt-2 line-clamp-2'>
                          {req.message}
                        </p>
                      </div>
                      <div className='bg-gray-50 p-4 text-right text-blue-600 font-semibold'>
                        View Project &rarr;
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className='text-center bg-white p-10 rounded-lg shadow-md'>
                  <h3 className='text-xl font-bold text-slate-900'>
                    No Projects Yet
                  </h3>
                  <p className='mt-2 text-gray-600'>
                    Click &quot;Contact&quot; in the navigation to start a new
                    project.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* My Support Tickets Section */}
          <section>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-2xl font-bold text-slate-800 flex items-center'>
                <FaLifeRing className='mr-3 text-red-600' /> My Support Tickets
              </h2>
              <Link
                href='/dashboard/tickets'
                className='text-sm font-medium text-blue-600 hover:underline'
              >
                Create New Ticket
              </Link>
            </div>
            <div className='space-y-4'>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className='bg-white p-5 rounded-lg shadow-md'
                  >
                    <div className='flex justify-between items-center'>
                      <p className='font-semibold text-gray-800'>
                        {ticket.subject}
                      </p>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${getTicketStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className='text-sm text-gray-500 mt-1'>
                      Submitted on:{" "}
                      {new Date(ticket.createdAt.toDate()).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className='text-center bg-white p-10 rounded-lg shadow-md'>
                  <h3 className='text-xl font-bold text-slate-900'>
                    No Tickets Found
                  </h3>
                  <p className='mt-2 text-gray-600'>
                    You can create a new support ticket if you need assistance.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
