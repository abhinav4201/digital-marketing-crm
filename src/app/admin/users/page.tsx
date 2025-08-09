/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useAuth, UserRole } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  DocumentData,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  managerId?: string;
  managerName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
  teaBreakStart?: string;
  teaBreakEnd?: string;
}

const PAGE_SIZE = 15;

const UserManagementPage = () => {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [managers, setManagers] = useState<UserData[]>([]); // <-- ADDED: State for managers list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(true);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  // MODIFIED: Consolidated edit state into a single object
  const [editFormData, setEditFormData] = useState<Partial<UserData>>({});

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      return;
    }

    // ADDED: Query to fetch all potential managers for the dropdown
    const managersQuery = query(
      collection(db, "users"),
      where("role", "in", ["admin", "manager"])
    );
    const unsubManagers = onSnapshot(managersQuery, (snapshot) => {
      setManagers(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserData))
      );
    });

    // PRESERVED: Your original paginated query for the main user list
    const q = query(
      collection(db, "users"),
      orderBy("email"),
      limit(PAGE_SIZE)
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedUsers: UserData[] = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as UserData)
        );
        setUsers(fetchedUsers);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
        setIsNextPageAvailable(querySnapshot.size === PAGE_SIZE);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load user data.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      unsubManagers(); // Cleanup manager listener
    };
  }, [role]);

  const handleEdit = (user: UserData) => {
    setEditingUserId(user.id);
    // MODIFIED: Set all editable fields in the form state object
    setEditFormData({
      role: user.role,
      managerId: user.managerId || "",
      shiftStartTime: user.shiftStartTime || "09:00",
      shiftEndTime: user.shiftEndTime || "17:00",
      lunchBreakStart: user.lunchBreakStart || "13:00",
      lunchBreakEnd: user.lunchBreakEnd || "14:00",
      teaBreakStart: user.teaBreakStart || "16:00",
      teaBreakEnd: user.teaBreakEnd || "16:15",
    });
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setEditFormData({});
  };

  const handleSave = async (userIdToUpdate: string) => {
    if (!user) {
      alert("You must be logged in to perform this action.");
      return;
    }

    // ADDED: Logic to find the manager's name based on the selected ID
    const selectedManager = managers.find(
      (m) => m.id === editFormData.managerId
    );
    const managerName = selectedManager ? selectedManager.displayName : null;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userIdToUpdate,
          ...editFormData,
          managerName, // Send the manager's name to the API
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role.");
      }
      handleCancel();
    } catch (err: any) {
      console.error("Error updating role:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // ADDED: Generic input handler for the edit form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // PRESERVED: Your original pagination functions
  const fetchNextPage = () => {
    if (!lastVisible || role !== "admin") return;
    setLoading(true);
    const q = query(
      collection(db, "users"),
      orderBy("email"),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );
    onSnapshot(q, (snapshot) => {
      setUsers(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserData))
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
      collection(db, "users"),
      orderBy("email"),
      endBefore(firstVisible),
      limitToLast(PAGE_SIZE)
    );
    onSnapshot(q, (snapshot) => {
      setUsers(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserData))
      );
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setFirstVisible(snapshot.docs[0]);
      setIsNextPageAvailable(true);
      setPage((p) => p - 1);
      setLoading(false);
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading users...</p>
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
    <div className='min-h-screen p-4 sm:p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='bg-[var(--surface)] shadow-sm rounded-lg p-6 mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold text-[var(--foreground)]'>
            User Management
          </h1>
          <p className='text-gray-500 mt-2'>
            Assign and manage roles for all users in the system.
          </p>
        </header>

        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Name
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Role & Manager
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Shift & Breaks
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {u.displayName || "N/A"}
                      </div>
                      <div className='text-sm text-gray-500'>{u.email}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {editingUserId === u.id ? (
                        <div className='flex flex-col gap-2'>
                          <select
                            name='role'
                            value={editFormData.role}
                            onChange={handleInputChange}
                            className='p-2 border border-gray-300 rounded-md text-sm'
                          >
                            <option value='user'>Client</option>
                            <option value='support_agent'>Support Agent</option>
                            <option value='sales_rep'>Sales Rep</option>
                            <option value='manager'>Manager</option>
                            <option value='admin'>Admin</option>
                          </select>
                          {/* ADDED: Conditional rendering for manager dropdown */}
                          {(editFormData.role === "sales_rep" ||
                            editFormData.role === "support_agent") && (
                            <select
                              name='managerId'
                              value={editFormData.managerId}
                              onChange={handleInputChange}
                              className='p-2 border border-gray-300 rounded-md text-sm'
                            >
                              <option value=''>Assign a Manager</option>
                              {managers.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.displayName}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className='text-sm font-medium text-gray-900'>
                            {u.role}
                          </div>
                          <div className='text-sm text-gray-500'>
                            Mgr: {u.managerName || "N/A"}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {editingUserId === u.id ? (
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <label className='w-20'>Shift:</label>
                            <input
                              type='time'
                              name='shiftStartTime'
                              value={editFormData.shiftStartTime}
                              onChange={handleInputChange}
                              className='p-1 border border-gray-300 rounded-md'
                            />
                            <span>-</span>
                            <input
                              type='time'
                              name='shiftEndTime'
                              value={editFormData.shiftEndTime}
                              onChange={handleInputChange}
                              className='p-1 border border-gray-300 rounded-md'
                            />
                          </div>
                          <div className='flex items-center gap-2'>
                            <label className='w-20'>Lunch:</label>
                            <input
                              type='time'
                              name='lunchBreakStart'
                              value={editFormData.lunchBreakStart}
                              onChange={handleInputChange}
                              className='p-1 border border-gray-300 rounded-md'
                            />
                            <span>-</span>
                            <input
                              type='time'
                              name='lunchBreakEnd'
                              value={editFormData.lunchBreakEnd}
                              onChange={handleInputChange}
                              className='p-1 border border-gray-300 rounded-md'
                            />
                          </div>
                          <div className='flex items-center gap-2'>
                            <label className='w-20'>Tea:</label>
                            <input
                              type='time'
                              name='teaBreakStart'
                              value={editFormData.teaBreakStart}
                              onChange={handleInputChange}
                              className='p-1 border border-gray-300 rounded-md'
                            />
                            <span>-</span>
                            <input
                              type='time'
                              name='teaBreakEnd'
                              value={editFormData.teaBreakEnd}
                              onChange={handleInputChange}
                              className='p-1 border border-gray-300 rounded-md'
                            />
                          </div>
                        </div>
                      ) : (
                        <div className='text-xs'>
                          <p>
                            <strong>Shift:</strong> {u.shiftStartTime || "N/A"}{" "}
                            - {u.shiftEndTime || "N/A"}
                          </p>
                          <p>
                            <strong>Lunch:</strong> {u.lunchBreakStart || "N/A"}{" "}
                            - {u.lunchBreakEnd || "N/A"}
                          </p>
                          <p>
                            <strong>Tea:</strong> {u.teaBreakStart || "N/A"} -{" "}
                            {u.teaBreakEnd || "N/A"}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      {editingUserId === u.id ? (
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => handleSave(u.id)}
                            className='p-2 text-green-600 hover:text-green-800'
                          >
                            <FaSave />
                          </button>
                          <button
                            onClick={handleCancel}
                            className='p-2 text-red-600 hover:text-red-800'
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(u)}
                          disabled={user?.uid === u.id}
                          className='p-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <FaEdit />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* PRESERVED: Your original pagination controls */}
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

export default UserManagementPage;
