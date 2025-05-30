
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { 
  getAuth, 
  updatePassword, 
  updateEmail, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Camera } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "",
    avatarUrl: ""
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Query Firestore to get the user document
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUserData({
          name: userData.name || "",
          email: userData.email || user.email || "",
          role: userData.role || "User",
          avatarUrl: userData.avatarUrl || ""
        });
        
        setProfileForm({
          name: userData.name || "",
          email: userData.email || user.email || "",
          currentPassword: ""
        });
      } else {
        // No user document found
        setUserData({
          name: user.displayName || "",
          email: user.email || "",
          role: "User",
          avatarUrl: user.photoURL || ""
        });
        
        setProfileForm({
          name: user.displayName || "",
          email: user.email || "",
          currentPassword: ""
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Check if email is being changed
    const emailChanged = profileForm.email !== user.email;
    
    if (emailChanged && !profileForm.currentPassword) {
      toast({
        title: "Error",
        description: "Password saat ini diperlukan untuk mengganti email",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update Firestore user document
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          name: profileForm.name,
          email: profileForm.email
        });
      }
      
      // If email is being changed, update auth email
      if (emailChanged) {
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(
          user.email!,
          profileForm.currentPassword
        );
        
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, profileForm.email);
      }
      
      toast({
        title: "Profil Diperbarui",
        description: "Profil Anda telah berhasil diperbarui.",
      });
      
      // Reset current password field
      setProfileForm({
        ...profileForm,
        currentPassword: ""
      });
      
      // Refresh user data
      fetchUserData();
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Kesalahan",
        description: "Password baru dan konfirmasi tidak cocok.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email!,
        passwordForm.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordForm.newPassword);
      
      toast({
        title: "Password Diperbarui",
        description: "Password Anda telah berhasil diperbarui.",
      });
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    
    try {
      setIsUploadingImage(true);
      
      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);
      
      // Update Firestore user document
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          avatarUrl: imageUrl
        });
      } else {
        // Create user document if it doesn't exist
        const usersCollection = collection(db, "users");
        await updateDoc(doc(usersCollection, user.uid), {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          role: "User",
          avatarUrl: imageUrl
        });
      }
      
      // Update local state
      setUserData({
        ...userData,
        avatarUrl: imageUrl
      });
      
      toast({
        title: "Foto Profil Diperbarui",
        description: "Foto profil Anda telah berhasil diperbarui.",
      });
      
    } catch (error: any) {
      console.error("Error updating profile picture:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui foto profil",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {userData.avatarUrl ? (
                <AvatarImage src={userData.avatarUrl} alt={userData.name} />
              ) : (
                <AvatarFallback className="text-xl">{userData.name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            
            <div className="absolute bottom-0 right-0">
              <label htmlFor="profile-picture" className="cursor-pointer">
                <div className="bg-primary text-white p-2 rounded-full hover:bg-primary/80 transition-colors">
                  <Camera className="h-4 w-4" />
                </div>
                <input 
                  type="file" 
                  id="profile-picture" 
                  accept="image/*"
                  className="hidden" 
                  onChange={handleProfilePictureChange}
                  disabled={isUploadingImage}
                />
              </label>
            </div>
            
            {isUploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                <Spinner />
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold">{userData.name}</h1>
            <p className="text-muted-foreground">{userData.role}</p>
            <p className="text-sm text-muted-foreground">{userData.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Informasi Profil</TabsTrigger>
              <TabsTrigger value="password">Ganti Password</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                  <CardDescription>
                    Perbarui informasi profil Anda di sini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, email: e.target.value })
                          }
                          required
                        />
                      </div>
                      {profileForm.email !== user.email && (
                        <div className="grid gap-2">
                          <Label htmlFor="current-password-for-email">Password Saat Ini</Label>
                          <Input
                            id="current-password-for-email"
                            type="password"
                            value={profileForm.currentPassword}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, currentPassword: e.target.value })
                            }
                            placeholder="Diperlukan untuk mengubah email"
                            required
                          />
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label htmlFor="role">Peran</Label>
                        <Input
                          id="role"
                          value={userData.role}
                          disabled
                        />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Ganti Password</CardTitle>
                  <CardDescription>
                    Perbarui password akun Anda di sini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">Password Saat Ini</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-password">Password Baru</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Memperbarui..." : "Perbarui Password"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
