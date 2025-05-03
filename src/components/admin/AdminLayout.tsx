
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  FolderTree,
  FileText,
  User, 
  LogOut, 
  Moon, 
  Sun,
  Bell,
  Search
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAuth, signOut } from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

const AdminLayout = ({ children, pageTitle }: AdminLayoutProps) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const auth = getAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const menuItems = [
    {
      title: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Berita",
      path: "/admin/news",
      icon: FileText,
    },
    {
      title: "Kategori",
      path: "/admin/categories",
      icon: FolderTree,
    },
    {
      title: "Pengguna",
      path: "/admin/users",
      icon: Users,
    },
    {
      title: "Profil",
      path: "/admin/profile",
      icon: User,
    },
  ];

  // Fetch user avatar from Firestore whenever the user changes
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user) {
        setUserAvatar(null);
        return;
      }
      
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.avatarUrl) {
            setUserAvatar(userData.avatarUrl);
          } else {
            setUserAvatar(user.photoURL);
          }
        } else {
          setUserAvatar(user.photoURL);
        }
      } catch (error) {
        console.error("Error fetching user avatar:", error);
        setUserAvatar(user.photoURL);
      }
    };

    fetchUserAvatar();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Berhasil",
        description: "Anda telah keluar dari sistem",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Pencarian",
        description: `Mencari "${searchQuery}"`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">FireNews</span>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <div className="px-4 pb-2">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari..." 
                    className="pl-8 bg-muted/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === item.path}
                          tooltip={item.title}
                        >
                          <Link to={item.path} className="transition-all">
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <Card className="mx-4 mb-4 bg-muted/40">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[120px]">{user?.email}</span>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className={isAdmin ? "text-xs bg-purple-100 dark:bg-purple-900/30" : "text-xs bg-blue-100 dark:bg-blue-900/30"}>
                          {isAdmin ? "Admin" : "User"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 gap-2 border-muted-foreground/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </Button>
                </CardContent>
              </Card>
            </SidebarFooter>
          </Sidebar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="border-b bg-background px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <SidebarTrigger />
                  <h1 className="ml-4 text-xl font-semibold">{pageTitle}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                  </Button>
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {userAvatar ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar} alt={user?.displayName || 'Admin'} />
                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6 bg-muted/10">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminLayout;
