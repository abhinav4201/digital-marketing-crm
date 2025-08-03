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
import { useRouter } from "next/navigation"; // Import useRouter

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
  const router = useRouter(); // Initialize router

  useEffect(() => {
    // This unsubscribes from the Firestore listener when the component unmounts
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (user) => {
      // If there's an existing Firestore listener, unsubscribe from it
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }

      if (user) {
        const userDocRef = doc(db, "users", user.uid);

        // NEW: Real-time listener for the user's document
        unsubscribeFromFirestore = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const newRole: UserRole = userData.role || "user";
            
            // If the role has changed, redirect to the appropriate dashboard
            if (role !== newRole) {
                setRole(newRole);
                switch (newRole) {
                    case "admin":
                        router.push("/admin");
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
            setUser(user); // Keep user object in sync

            // Ensure the document is up-to-date (optional, but good practice)
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
            // This case handles a brand new user
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
