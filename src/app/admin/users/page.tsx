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
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
}

const PAGE_SIZE = 15;

const UserManagementPage = () => {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(true);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");

  const handleEdit = (user: UserData) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role);
  };

  const handleCancel = () => {
    setEditingUserId(null);
  };

  const handleSaveRole = async (userIdToUpdate: string) => {
    if (!user) {
      alert("You must be logged in to perform this action.");
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userIdToUpdate, newRole: selectedRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role.");
      }
      setEditingUserId(null); // Exit editing mode on success
    } catch (err: any) {
      console.error("Error updating role:", err);
      alert(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      return;
    }

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

    return () => unsubscribe();
  }, [role]);

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

  const handleRoleChange = async (
    userIdToUpdate: string,
    newRole: UserRole
  ) => {
    if (!user) {
      alert("You must be logged in to perform this action.");
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userIdToUpdate, newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role.");
      }
      // UI will update automatically via onSnapshot
    } catch (err: any) {
      console.error("Error updating role:", err);
      alert(`Error: ${err.message}`);
    }
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
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Name
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Email
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {u.displayName || "N/A"}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {u.email}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {editingUserId === u.id ? (
                        <div className='flex items-center gap-2'>
                          <select
                            value={selectedRole}
                            onChange={(e) =>
                              setSelectedRole(e.target.value as UserRole)
                            }
                            className='p-2 border border-gray-300 rounded-md'
                          >
                            <option value='user'>User</option>
                            <option value='sales_rep'>Sales Rep</option>
                            <option value='support_agent'>Support Agent</option>
                            <option value='admin'>Admin</option>
                          </select>
                          <button
                            onClick={() => handleSaveRole(u.id)}
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
                        <div className='flex items-center gap-4'>
                          <span>{u.role}</span>
                          <button
                            onClick={() => handleEdit(u)}
                            disabled={user?.uid === u.id}
                            className='p-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            <FaEdit />
                          </button>
                          {user?.uid === u.id && (
                            <p className='text-xs text-gray-400 mt-1'>
                              (Cannot change own role)
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default UserManagementPage;
