"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { db } from "../firebase";
import { doc, DocumentReference, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "../firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  ref: DocumentReference | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  ref: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ref, setRef] = useState<DocumentReference | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      // Check if user doc exists, if not, create it
      if (firebaseUser) {
        const userDocRef = doc(db, "root", firebaseUser.uid);
        setRef(userDocRef);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, ref }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
