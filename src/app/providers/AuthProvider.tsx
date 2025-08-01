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
import { doc, setDoc, getDoc } from "firebase/firestore";

// Define user roles
export type UserRole = "admin" | "sales_rep" | "support_agent" | "user";

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let userRole: UserRole = "user"; // Default role
        if (userDocSnap.exists()) {
          // Assign role from Firestore if it exists, otherwise it remains 'user'
          userRole = userDocSnap.data().role || "user";
        }

        // Create or update the user document in Firestore
        await setDoc(
          userDocRef,
          {
            email: user.email,
            displayName: user.displayName,
            // Ensure the role is set in Firestore. If new user, they default to 'user'.
            role: userRole,
          },
          { merge: true }
        );

        setRole(userRole);
        setUser(user);
      } else {
        setUser(null);
        setRole("user"); // Reset role on sign-out
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
