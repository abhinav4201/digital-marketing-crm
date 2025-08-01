"use client";
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  endBefore,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import Link from "next/link";
import Papa from "papaparse";
import { useCallback, useEffect, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaBell, FaDownload } from "react-icons/fa";
import { db } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";

interface Request {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  createdAt: Timestamp;
  status?: string;
  lastUpdatedBy?: "user" | "admin";
  adminHasUnreadUpdate?: boolean;
}

const AdminPage = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<"allProjects" | "filter">(
    "allProjects"
  );

  // State for "All Projects" tab
  const [projects, setProjects] = useState<Request[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(true);
  const [page, setPage] = useState(1);

  // State for "Filter & Export" tab
  const [allRequestsForFilter, setAllRequestsForFilter] = useState<Request[]>(
    []
  );
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loadingFilter, setLoadingFilter] = useState(false);

  const PAGE_SIZE = 10;

  const fetchInitialProjects = useCallback(() => {
    if (role !== "admin") return;
    setLoadingProjects(true);
    const q = query(
      collection(db, "requests"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );
    return onSnapshot(q, (querySnapshot) => {
      const fetchedProjects: Request[] = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Request)
      );
      setProjects(fetchedProjects);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setFirstVisible(querySnapshot.docs[0]);
      setIsNextPageAvailable(querySnapshot.size === PAGE_SIZE);
      setLoadingProjects(false);
    });
  }, [role]);

  const fetchNextPage = () => {
    if (role !== "admin" || !lastVisible) return;
    setLoadingProjects(true);
    const q = query(
      collection(db, "requests"),
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );
    onSnapshot(q, (querySnapshot) => {
      const fetchedProjects: Request[] = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Request)
      );
      setProjects(fetchedProjects);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setFirstVisible(querySnapshot.docs[0]);
      setIsNextPageAvailable(querySnapshot.size === PAGE_SIZE);
      setPage((prev) => prev + 1);
      setLoadingProjects(false);
    });
  };

  const fetchPrevPage = () => {
    if (role !== "admin" || !firstVisible) return;
    setLoadingProjects(true);
    const q = query(
      collection(db, "requests"),
      orderBy("createdAt", "desc"),
      endBefore(firstVisible),
      limitToLast(PAGE_SIZE)
    );
    onSnapshot(q, (querySnapshot) => {
      const fetchedProjects: Request[] = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Request)
      );
      setProjects(fetchedProjects);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setFirstVisible(querySnapshot.docs[0]);
      setIsNextPageAvailable(true);
      setPage((prev) => prev - 1);
      setLoadingProjects(false);
    });
  };

  const fetchAllForFilter = useCallback(() => {
    if (role !== "admin") return;
    setLoadingFilter(true);
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
      const allReqs: Request[] = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Request)
      );
      setAllRequestsForFilter(allReqs);
      setLoadingFilter(false);
    });
  }, [role]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (role === "admin") {
      if (activeTab === "allProjects") {
        unsubscribe = fetchInitialProjects();
      } else if (activeTab === "filter") {
        unsubscribe = fetchAllForFilter();
      }
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [role, activeTab, fetchInitialProjects, fetchAllForFilter]);

  const handleFilter = () => {
    let filtered = allRequestsForFilter;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((req) => req.createdAt.toDate() >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((req) => req.createdAt.toDate() <= end);
    }
    setFilteredRequests(filtered);
  };

  const downloadCSV = () => {
    const csvData = filteredRequests.map((req) => ({
      Name: req.name,
      Email: req.email,
      Phone: req.phone,
      Message: req.message,
      Date: new Date(req.createdAt?.toDate()).toLocaleString(),
      Status: req.status || "Pending",
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "requests.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIndicator = (status?: string) => {
    const baseClasses = "w-3 h-3 rounded-full mr-2";
    switch (status) {
      case "Project Approved":
        return <div className={`${baseClasses} bg-green-500`}></div>;
      case "Quotation Sent":
        return <div className={`${baseClasses} bg-blue-500`}></div>;
      case "Services Selected":
        return <div className={`${baseClasses} bg-indigo-500`}></div>;
      default:
        return <div className={`${baseClasses} bg-yellow-500`}></div>;
    }
  };

  if (role !== "admin") {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-red-500'>
          You are not authorized to view this page.
        </p>
      </div>
    );
  }

  const TabButton = ({
    tabName,
    label,
  }: {
    tabName: "allProjects" | "filter";
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
        activeTab === tabName
          ? "border-[var(--primary)] text-[var(--primary)]"
          : "border-transparent text-[var(--foreground-secondary)] hover:border-gray-300 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );

  const ProjectTable = ({ data }: { data: Request[] }) => (
    <div className='overflow-x-auto'>
      <table className='min-w-full'>
        <thead className='bg-blue-700 '>
          <tr>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'
            >
              Client Name
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'
            >
              Status
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'
            >
              Date Submitted
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {data.map((req, index) => {
            const hasNewUpdate = req.adminHasUnreadUpdate === true;
            return (
              <tr
                key={req.id}
                className={`transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 ${
                  hasNewUpdate ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-[var(--foreground)]'>
                    {req.name}
                  </div>
                  <div className='text-sm text-[var(--foreground-secondary)]'>
                    {req.email}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    {getStatusIndicator(req.status)}
                    <span className='text-sm text-[var(--foreground-secondary)]'>
                      {req.status || "Pending"}
                    </span>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground-secondary)]'>
                  {new Date(req.createdAt?.toDate()).toLocaleDateString()}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                  <Link
                    href={`/dashboard/${req.id}`}
                    className='text-[var(--primary)] hover:underline flex items-center'
                  >
                    {hasNewUpdate && (
                      <FaBell className='mr-2 text-[var(--accent)] animate-pulse' />
                    )}
                    View Details
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className='min-h-screen p-4 sm:p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='bg-[var(--surface)] shadow-sm rounded-lg p-6 mb-8'>
          <div className='flex flex-col sm:flex-row justify-between sm:items-center'>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold text-[var(--foreground)]'>
                Admin Panel
              </h1>
              <p className='text-gray-500 mt-2'>Welcome, Admin!</p>
            </div>
            {/* CORRECTED: This container now wraps on mobile and provides consistent gaps */}
            <div className='mt-4 sm:mt-0 flex flex-wrap items-center gap-2'>
              <Link
                href='/admin/attendance'
                className='bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm'
              >
                Attendance
              </Link>
              <Link
                href='/admin/analytics'
                className='bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm'
              >
                Analytics
              </Link>
              <Link
                href='/admin/tickets'
                className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm'
              >
                Tickets
              </Link>
              <Link
                href='/admin/campaigns'
                className='bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm'
              >
                Campaigns
              </Link>
              <Link
                href='/admin/templates'
                className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm'
              >
                Templates
              </Link>
              <Link
                href='/admin/pipeline'
                className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm'
              >
                Pipeline
              </Link>
              <Link
                href='/admin/users'
                className='bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm'
              >
                Users
              </Link>
              <Link
                href='/admin/blog'
                className='bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm'
              >
                Blog
              </Link>
            </div>
          </div>
        </header>

        <div className='border-b border-gray-200'>
          <div className='flex space-x-4'>
            <TabButton tabName='allProjects' label='All Projects' />
            <TabButton tabName='filter' label='Filter & Export' />
          </div>
        </div>

        <div className='mt-6'>
          {activeTab === "allProjects" && (
            <div className='bg-[var(--surface)] rounded-lg shadow-md overflow-hidden'>
              <div className='p-6'>
                <h2 className='text-2xl font-semibold text-[var(--foreground)]'>
                  Recent User Projects
                </h2>
              </div>
              {loadingProjects ? (
                <p className='p-6 text-[var(--foreground-secondary)]'>
                  Loading projects...
                </p>
              ) : (
                <>
                  <ProjectTable data={projects} />
                  <div className='bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6'>
                    <button
                      onClick={fetchPrevPage}
                      disabled={page <= 1}
                      className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <FaArrowLeft className='mr-2' /> Previous
                    </button>
                    <span className='text-sm text-[var(--foreground-secondary)]'>
                      Page {page}
                    </span>
                    <button
                      onClick={fetchNextPage}
                      disabled={!isNextPageAvailable}
                      className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Next <FaArrowRight className='ml-2' />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "filter" && (
            <div className='bg-[var(--surface)] p-6 rounded-lg shadow-md'>
              {loadingFilter ? (
                <p className='text-[var(--foreground-secondary)]'>
                  Loading data...
                </p>
              ) : (
                <>
                  <h2 className='text-2xl font-semibold mb-6 text-[var(--foreground)]'>
                    Filter Requests & Export
                  </h2>
                  <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-end mb-6'>
                    <div>
                      <label
                        htmlFor='startDate'
                        className='block text-sm font-medium text-[var(--foreground-secondary)]'
                      >
                        Start Date
                      </label>
                      <input
                        type='date'
                        id='startDate'
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className='mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                      />
                    </div>
                    <div>
                      <label
                        htmlFor='endDate'
                        className='block text-sm font-medium text-[var(--foreground-secondary)]'
                      >
                        End Date
                      </label>
                      <input
                        type='date'
                        id='endDate'
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className='mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                      />
                    </div>
                    <button
                      onClick={handleFilter}
                      className='bg-[var(--primary)] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm'
                    >
                      Apply Filter
                    </button>
                  </div>
                  <div className='mt-8'>
                    <div className='flex justify-between items-center mb-4'>
                      <h3 className='text-xl font-semibold text-[var(--foreground)]'>
                        Filtered Results ({filteredRequests.length})
                      </h3>
                      <button
                        onClick={downloadCSV}
                        disabled={filteredRequests.length === 0}
                        className='bg-[var(--accent)] hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center shadow-sm disabled:bg-gray-400'
                      >
                        <FaDownload className='mr-2' /> Download CSV
                      </button>
                    </div>
                    <ProjectTable data={filteredRequests} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
