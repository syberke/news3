
import { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { auth, db } from "@/services/firebase";

type UserRole = "Admin" | "User";

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  userRole: UserRole | null;
  isLoading: boolean;
  setUserRole: (uid: string, role: UserRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  userRole: null,
  isLoading: true,
  setUserRole: async () => {}
});

// Default admin email
const ADMIN_EMAIL = "admin@firenews.com";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRoleState] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to update a user's role
  const setUserRole = async (uid: string, role: UserRole) => {
    try {
      const userRef = doc(db, "users", uid);
      // Update both role and isAdmin fields for compatibility
      await setDoc(userRef, { 
        role, 
        isAdmin: role === "Admin" 
      }, { merge: true });
      
      // If this is the current user, update their state
      if (user && user.uid === uid) {
        setUserRoleState(role);
        setIsAdmin(role === "Admin");
      }
      
      return;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // First check if user exists in our database
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          
          // If user exists in database, check their role
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const role = userData.role as UserRole || (userData.isAdmin ? "Admin" : "User");
            setUserRoleState(role);
            setIsAdmin(role === "Admin" || userData.isAdmin === true);
            
            // Update lastLogin time
            await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
          } else {
            // Create new user with default role
            // Always make admin@firenews.com an admin
            const defaultRole: UserRole = user.email === ADMIN_EMAIL ? "Admin" : "User";
            await setDoc(userRef, { 
              email: user.email,
              role: defaultRole,
              isAdmin: defaultRole === "Admin", // Keep isAdmin field for backward compatibility
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              displayName: user.displayName || user.email?.split('@')[0],
              photoURL: user.photoURL
            });
            setUserRoleState(defaultRole);
            setIsAdmin(defaultRole === "Admin");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          // Fallback to the original admin email check
          const isDefaultAdmin = user.email === ADMIN_EMAIL;
          setUserRoleState(isDefaultAdmin ? "Admin" : "User");
          setIsAdmin(isDefaultAdmin);
        }
      } else {
        setUserRoleState(null);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, userRole, isLoading, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
