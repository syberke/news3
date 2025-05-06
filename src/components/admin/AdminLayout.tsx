
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Search,
  Ban,
  MessageSquareX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, signOut } from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: "comment_report" | "user_blocked";
  commentId?: string;
  userId?: string;
  blockedUserId?: string;
  reportedBy?: string;
  reporterName?: string;
  blockedByUserId?: string;
  blockerName?: string;
  createdAt: any;
  read: boolean;
  newsId?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

const AdminLayout = ({ children, pageTitle }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const auth = getAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  // Fetch admin notifications
  useEffect(() => {
    if (!user || !isAdmin) return;

    const notificationsQuery = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      
      setNotifications(notificationsList);
      
      // Count unread notifications
      const unread = notificationsList.filter(notification => !notification.read).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

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

  const markNotificationAsRead = async (notificationId: string) => {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await markNotificationAsRead(notification.id);
    
    // Handle different notification types
    if (notification.type === "comment_report" && notification.newsId) {
      // Navigate to the news detail page
      navigate(`/news/${notification.newsId}`);
      setNotificationsOpen(false);
    }
  };

  const handleDeleteComment = async (commentId: string, notificationId: string) => {
    try {
      // Delete the comment
      const commentRef = doc(db, "comments", commentId);
      await deleteDoc(commentRef);
      
      // Mark notification as read
      await markNotificationAsRead(notificationId);
      
      toast({
        title: "Comment Deleted",
        description: "The reported comment has been deleted"
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  };

  const handleBanUser = async (userId: string, notificationId: string) => {
    try {
      // Ban the user by updating their document
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { 
        isBanned: true,
        bannedAt: new Date().toISOString()
      });
      
      // Mark notification as read
      await markNotificationAsRead(notificationId);
      
      toast({
        title: "User Banned",
        description: "The user has been banned"
      });
    } catch (error) {
      console.error("Error banning user:", error);
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive"
      });
    }
  };

  const formatNotificationTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) {
      return "Just now";
    }
    
    const date = timestamp.toDate();
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // difference in seconds
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
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
                  <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                            {unreadCount}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 max-h-96 overflow-auto">
                      <div className="p-3 border-b border-border">
                        <h4 className="font-semibold">Notifications</h4>
                      </div>
                      <div className="divide-y divide-border">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={`p-3 ${notification.read ? 'bg-background' : 'bg-muted/30'}`}
                            >
                              {notification.type === "comment_report" && (
                                <div>
                                  <div className="flex justify-between">
                                    <p className="text-sm font-medium">
                                      <span className="font-semibold">{notification.reporterName}</span> reported a comment
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {formatNotificationTime(notification.createdAt)}
                                    </span>
                                  </div>
                                  <div className="flex mt-2 gap-2">
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs"
                                      onClick={() => handleNotificationClick(notification)}
                                    >
                                      View
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs flex items-center gap-1"
                                      onClick={() => handleDeleteComment(notification.commentId!, notification.id)}
                                    >
                                      <MessageSquareX className="h-3 w-3" />
                                      Delete Comment
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      size="sm"
                                      className="w-full text-xs flex items-center gap-1"
                                      onClick={() => handleBanUser(notification.userId!, notification.id)}
                                    >
                                      <Ban className="h-3 w-3" />
                                      Ban User
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {notification.type === "user_blocked" && (
                                <div>
                                  <div className="flex justify-between">
                                    <p className="text-sm">
                                      <span className="font-semibold">{notification.blockerName}</span> blocked a user
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {formatNotificationTime(notification.createdAt)}
                                    </span>
                                  </div>
                                  <div className="flex mt-2 gap-2">
                                    <Button 
                                      variant="destructive"
                                      size="sm"
                                      className="w-full text-xs flex items-center gap-1"
                                      onClick={() => handleBanUser(notification.blockedUserId!, notification.id)}
                                    >
                                      <Ban className="h-3 w-3" />
                                      Ban User
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs"
                                      onClick={() => markNotificationAsRead(notification.id)}
                                    >
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
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
