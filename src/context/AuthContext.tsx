
import { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  onAuthStateChanged,
  sendEmailVerification
} from "firebase/auth";
import { 
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";

type UserRole = "Admin" | "User";

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  userRole: UserRole | null;
  isLoading: boolean;
  setUserRole: (uid: string, role: UserRole) => Promise<void>;
  likedArticles: string[];
  addLikedArticle: (articleId: string) => Promise<void>;
  hasLikedArticle: (articleId: string) => boolean;
  isVerified: boolean;
  sendVerificationEmail: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  userRole: null,
  isLoading: true,
  setUserRole: async () => {},
  likedArticles: [],
  addLikedArticle: async () => {},
  hasLikedArticle: () => false,
  isVerified: false,
  sendVerificationEmail: async () => {}
});

// Default admin email
const ADMIN_EMAIL = "admin@firenews.com";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRoleState] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likedArticles, setLikedArticles] = useState<string[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  // Function to send verification email
  const sendVerificationEmail = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user is logged in",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendEmailVerification(user);
      toast({
        title: "Email Sent",
        description: "Verification email has been sent to your inbox."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

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

  // Function to add an article to the user's liked articles
  const addLikedArticle = async (articleId: string) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedLikedArticles = [...likedArticles, articleId];
      
      await setDoc(userRef, { 
        likedArticles: updatedLikedArticles 
      }, { merge: true });
      
      setLikedArticles(updatedLikedArticles);
    } catch (error) {
      console.error("Error adding liked article:", error);
      throw error;
    }
  };

  // Function to check if user has liked an article
  const hasLikedArticle = (articleId: string): boolean => {
    return likedArticles.includes(articleId);
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
            
            // Load liked articles if available
            if (userData.likedArticles && Array.isArray(userData.likedArticles)) {
              setLikedArticles(userData.likedArticles);
            }
            
            // Check if user is verified
            const isUserVerified = userData.isVerified === true || role === "Admin" || user.email === ADMIN_EMAIL;
            setIsVerified(isUserVerified);
            
            // Update lastLogin time
            await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
          } else {
            // Create new user with default role
            // Always make admin@firenews.com an admin
            const defaultRole: UserRole = user.email === ADMIN_EMAIL ? "Admin" : "User";
            const isUserVerified = user.email === ADMIN_EMAIL || defaultRole === "Admin" || user.emailVerified;
            
            await setDoc(userRef, { 
              email: user.email,
              role: defaultRole,
              isAdmin: defaultRole === "Admin", // Keep isAdmin field for backward compatibility
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              displayName: user.displayName || user.email?.split('@')[0],
              photoURL: user.photoURL,
              likedArticles: [],
              isVerified: isUserVerified
            });
            setUserRoleState(defaultRole);
            setIsAdmin(defaultRole === "Admin");
            setLikedArticles([]);
            setIsVerified(isUserVerified);
            
            // Send verification email if not admin and not already verified
            if (!isUserVerified && defaultRole !== "Admin" && user.email !== ADMIN_EMAIL && !user.emailVerified) {
              await sendEmailVerification(user);
            }
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          // Fallback to the original admin email check
          const isDefaultAdmin = user.email === ADMIN_EMAIL;
          setUserRoleState(isDefaultAdmin ? "Admin" : "User");
          setIsAdmin(isDefaultAdmin);
          setIsVerified(isDefaultAdmin || user.emailVerified);
        }
      } else {
        setUserRoleState(null);
        setIsAdmin(false);
        setLikedArticles([]);
        setIsVerified(false);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      userRole, 
      isLoading, 
      setUserRole,
      likedArticles,
      addLikedArticle,
      hasLikedArticle,
      isVerified,
      sendVerificationEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
