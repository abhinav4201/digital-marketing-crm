/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { FaCheck, FaTimes, FaClock } from "react-icons/fa";
import { useInfoModalStore } from "../../store/useInfoModalStore";

interface ApprovalRequest {
  id: string; // The ID of the approval request document
  attendanceId: string; // The ID of the parent attendance document
  userName: string;
  type: "overtime" | "extended_lunch" | "extended_tea";
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: Timestamp;
}

const ApprovalsPage = () => {
  const { user, role } = useAuth();
  const { openModal: openInfoModal } = useInfoModalStore();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (role !== "admin" && role !== "manager")) {
      setLoading(false);
      return;
    }

    let q = query(
      collectionGroup(db, "approvalRequests"),
      where("status", "==", "pending")
    );

    // If the user is a manager (and not an admin), filter by their ID
    if (role === "manager") {
      q = query(q, where("managerId", "==", user.uid));
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedRequests = await Promise.all(
        snapshot.docs.map(async (d) => {
          const requestData = d.data();
          const attendanceRef = d.ref.parent.parent;
          if (!attendanceRef) return null;

          const attendanceSnap = await getDoc(attendanceRef);
          const attendanceData = attendanceSnap.data();

          return {
            id: d.id,
            attendanceId: attendanceRef.id,
            userName: attendanceData?.userName || "Unknown User",
            ...requestData,
          } as ApprovalRequest;
        })
      );

      setRequests(fetchedRequests.filter(Boolean) as ApprovalRequest[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, role]);

  const handleApproval = async (
    attendanceId: string,
    requestId: string,
    newStatus: "approved" | "denied"
  ) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/attendance/approve-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ attendanceId, requestId, newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status.");
      }

      openInfoModal("Success", `Request has been ${newStatus}.`);
    } catch (error: any) {
      console.error("Error updating request:", error);
      openInfoModal("Error", "Failed to update the request.");
    }
  };

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading approval requests...</p>
      </div>
    );
  if (role !== "admin" && role !== "manager")
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-red-500'>
          You are not authorized to view this page.
        </p>
      </div>
    );

  return (
    <div className='min-h-screen p-4 sm:p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='bg-white shadow-sm rounded-lg p-6 mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold text-gray-900'>
            Approval Dashboard
          </h1>
          <p className='text-gray-500 mt-2'>
            Review and act on pending requests from your team.
          </p>
        </header>

        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Employee
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Request Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Reason
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {req.userName}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {new Date(req.createdAt.toDate()).toLocaleString()}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize'>
                        {req.type.replace("_", " ")}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-500 max-w-sm whitespace-normal'>
                        {req.reason}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() =>
                              handleApproval(
                                req.attendanceId,
                                req.id,
                                "approved"
                              )
                            }
                            className='p-2 text-green-600 hover:text-green-800'
                            title='Approve'
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() =>
                              handleApproval(req.attendanceId, req.id, "denied")
                            }
                            className='p-2 text-red-600 hover:text-red-800'
                            title='Deny'
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className='text-center py-12 text-gray-500'>
                      <FaClock className='mx-auto h-10 w-10 text-gray-400' />
                      <p className='mt-2'>No pending requests.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsPage;
