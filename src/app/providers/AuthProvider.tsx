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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // When a user signs in, get a reference to their document in the 'users' collection
        const userDocRef = doc(db, "users", user.uid);

        // Create the user document if it doesn't exist
        await setDoc(
          userDocRef,
          {
            email: user.email,
            displayName: user.displayName,
          },
          { merge: true }
        ); // merge:true prevents overwriting existing data

        // Check if the user is an admin
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setUser(user);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
