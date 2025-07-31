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
import { FaBell } from "react-icons/fa";

interface Request {
  id: string;
  message: string;
  createdAt: Timestamp;
  status?: string;
  lastUpdatedBy?: "user" | "admin";
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "requests"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userRequests: Request[] = [];
        querySnapshot.forEach((doc) => {
          userRequests.push({ id: doc.id, ...doc.data() } as Request);
        });
        setRequests(userRequests);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const getStatusText = (status?: string) => {
    if (!status || status === "Pending") {
      return "Service Selection Pending";
    }
    return status;
  };

  const getStatusChipColor = (status?: string) => {
    const currentStatus = getStatusText(status);
    switch (currentStatus) {
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

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <p className='text-text-secondary'>Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background p-4 sm:p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl sm:text-4xl font-bold text-slate-900 mb-8'>
          Welcome, {user?.displayName || user?.email}
        </h1>
        {requests.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {requests.map((req) => {
              const hasNewUpdate = req.lastUpdatedBy === "admin";
              return (
                <Link href={`/dashboard/${req.id}`} key={req.id}>
                  <div className=' bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col'>
                    <div className='p-5 flex-grow'>
                      <div className='flex justify-between items-start'>
                        <p
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusChipColor(
                            req.status
                          )}`}
                        >
                          {getStatusText(req.status)}
                        </p>
                        {hasNewUpdate && (
                          <div className='flex items-center text-xs font-bold text-teal-600 animate-pulse'>
                            <FaBell className='mr-1' /> New Update
                          </div>
                        )}
                      </div>
                      <p className='text-lg font-bold text-slate-800 mt-4'>
                        Request from{" "}
                        {new Date(req.createdAt?.toDate()).toLocaleDateString()}
                      </p>
                      <p className='text-sm text-gray-600 mt-2 line-clamp-3'>
                        {req.message}
                      </p>
                    </div>
                    <div className='bg-gray-50 p-4 text-right text-blue-600 font-semibold'>
                      View Project &rarr;
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className='text-center bg-white p-10 rounded-lg shadow-md'>
            <h2 className='text-2xl font-bold text-slate-900'>
              No Projects Yet
            </h2>
            <p className='mt-2 text-gray-600'>
              Click &quot;Contact&quot; in the navigation to start a new project request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
