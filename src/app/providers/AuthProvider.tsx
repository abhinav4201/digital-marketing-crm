"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// Define user roles
export type UserRole =
  | "admin"
  | "sales_rep"
  | "support_agent"
  | "user"
  | "manager"; // FIX: Added 'manager' role

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: "user", // Default role
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>("user");
  const router = useRouter();

  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }

      if (user) {
        const userDocRef = doc(db, "users", user.uid);

        unsubscribeFromFirestore = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const newRole: UserRole = userData.role || "user";

            if (role !== newRole) {
              setRole(newRole);
              // Redirect based on the new role
              switch (newRole) {
                case "admin":
                  router.push("/admin");
                  break;
                case "manager": // ADDED: Redirect for manager
                  router.push("/admin/approvals");
                  break;
                case "sales_rep":
                  router.push("/sales/dashboard");
                  break;
                case "support_agent":
                  router.push("/support/dashboard");
                  break;
                default:
                  router.push("/dashboard");
                  break;
              }
            }
            setUser(user);

            await setDoc(
              userDocRef,
              {
                email: user.email,
                displayName: user.displayName,
                role: newRole,
              },
              { merge: true }
            );
          } else {
            await setDoc(
              userDocRef,
              {
                email: user.email,
                displayName: user.displayName,
                role: "user",
              },
              { merge: true }
            );
            setRole("user");
            setUser(user);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setRole("user");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
    };
  }, [role, router]);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
