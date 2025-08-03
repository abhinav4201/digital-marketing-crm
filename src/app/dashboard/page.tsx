"use client";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBell, FaBriefcase, FaLifeRing, FaSpinner } from "react-icons/fa";
import { db } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";
import { useInfoModalStore } from "../store/useInfoModalStore";

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
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openModal } = useInfoModalStore();

  useEffect(() => {
    // Check Authentication Status
    if (authLoading) {
      return;
    }

    // Handle redirects for non-user roles
    if (role !== "user") {
      if (role === "admin") router.replace("/admin");
      if (role === "sales_rep") router.replace("/sales/dashboard");
      if (role === "support_agent") router.replace("/support/dashboard");
      return;
    }

    // Fetch user data
    if (user && role === "user") {
      const projectsQuery = query(
        collection(db, "requests"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const unsubscribeProjects = onSnapshot(
        projectsQuery,
        (snapshot) => {
          setRequests(
            snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as ProjectRequest)
            )
          );
          setIsLoading(false);
        },
        (error) => {
          openModal("Error", `Failed to fetch projects: ${error.message}`);
          setIsLoading(false);
        }
      );

      const ticketsQuery = query(
        collection(db, "tickets"),
        where("createdBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const unsubscribeTickets = onSnapshot(
        ticketsQuery,
        (snapshot) => {
          setTickets(
            snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as SupportTicket)
            )
          );
        },
        (error) => {
          openModal("Error", `Failed to fetch tickets: ${error.message}`);
        }
      );

      return () => {
        unsubscribeProjects();
        unsubscribeTickets();
      };
    } else {
      setIsLoading(false);
    }
  }, [user, role, router, authLoading, openModal]);

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

  const getTicketPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-orange-100 text-orange-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='flex items-center space-x-3'>
          <FaSpinner className='animate-spin text-blue-600' size={24} />
          <p className='text-gray-600 text-base'>Loading your dashboard...</p>
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
              Welcome, {user?.displayName || user?.email}
            </h1>
            <p className='text-sm sm:text-base text-gray-500 mt-1'>
              Manage your projects and support tickets.
            </p>
          </div>
          <Link
            href='/contact'
            className='inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <FaBriefcase className='mr-2' />
            Start New Project
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* My Projects Section */}
          <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-900 flex items-center mb-4'>
              <FaBriefcase className='mr-2 text-blue-600' /> My Projects
            </h2>
            <div className='space-y-3 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <Link href={`/dashboard/${req.id}`} key={req.id}>
                    <div className='p-3 border rounded-md hover:bg-gray-100 transition-colors'>
                      <div className='flex justify-between items-center gap-2'>
                        <div className='flex-1 min-w-0'>
                          <p
                            className='font-semibold text-gray-800 text-sm sm:text-base truncate'
                            title={req.message}
                          >
                            {req.message}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            Created:{" "}
                            {new Date(
                              req.createdAt?.toDate()
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          {req.lastUpdatedBy === "admin" && (
                            <span className='text-xs font-bold text-teal-600 animate-pulse flex items-center'>
                              <FaBell className='mr-1' /> Update
                            </span>
                          )}
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${getStatusChipColor(
                              req.status
                            )}`}
                          >
                            {req.status || "Service Selection Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className='text-center py-6'>
                  <p className='text-gray-600 text-sm sm:text-base'>
                    No projects yet.{" "}
                    <Link
                      href='/contact'
                      className='text-blue-600 hover:underline'
                    >
                      Start a new project
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* My Support Tickets Section */}
          <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg sm:text-xl font-semibold text-gray-900 flex items-center'>
                <FaLifeRing className='mr-2 text-red-600' /> My Support Tickets
              </h2>
              <Link
                href='/dashboard/tickets'
                className='inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                Create New Ticket
              </Link>
            </div>
            <div className='space-y-3 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className='p-3 border rounded-md hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex justify-between items-center gap-2'>
                      <div className='flex-1 min-w-0'>
                        <p
                          className='font-semibold text-gray-800 text-sm sm:text-base truncate'
                          title={ticket.subject}
                        >
                          {ticket.subject}
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          Submitted:{" "}
                          {new Date(
                            ticket.createdAt.toDate()
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${getTicketStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${getTicketPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='text-center py-6'>
                  <p className='text-gray-600 text-sm sm:text-base'>
                    No tickets found.{" "}
                    <Link
                      href='/dashboard/tickets'
                      className='text-blue-600 hover:underline'
                    >
                      Create a new ticket
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
