
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, deleteDoc, DocumentData, QuerySnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

// Fetch all users from Firebase
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      displayName: doc.data().displayName || 'Anonymous',
      photoURL: doc.data().photoURL || null,
    } as User));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Fetch admin users only
export const fetchAdminUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, "users");
    const adminQuery = query(usersCollection, where("isAdmin", "==", true));
    const usersSnapshot = await getDocs(adminQuery);
    
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      displayName: doc.data().displayName || 'Admin',
      photoURL: doc.data().photoURL || null,
    } as User));
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
};

// Create a new user
export const createUser = async (userData: {
  email: string;
  password: string;
  displayName?: string;
  role: "Admin" | "User";
}): Promise<User> => {
  try {
    // Create user authentication
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    const userRef = doc(db, "users", user.uid);
    const newUser = {
      email: userData.email,
      displayName: userData.displayName || userData.email.split('@')[0],
      photoURL: null,
      isAdmin: userData.role === "Admin",
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    await setDoc(userRef, newUser);
    
    return {
      id: user.uid,
      ...newUser
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data(),
        displayName: userSnap.data().displayName || 'Anonymous',
        photoURL: userSnap.data().photoURL || null,
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

// Update user
export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  try {
    const userRef = doc(db, "users", userId);
    
    // Ensure we're only updating allowed fields
    const updatedData: Record<string, any> = {};
    if (userData.displayName !== undefined) updatedData.displayName = userData.displayName;
    if (userData.photoURL !== undefined) updatedData.photoURL = userData.photoURL;
    
    await updateDoc(userRef, updatedData);
    
    // Get the updated user
    const updatedUser = await getUserById(userId);
    if (!updatedUser) {
      throw new Error("Failed to fetch updated user");
    }
    
    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
