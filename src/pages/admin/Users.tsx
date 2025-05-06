
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Search, User, Edit, Trash, UserPlus, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchAllUsers, User as UserType, verifyUser } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { createUser, updateUser, deleteUser } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";

const AdminUsers = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { setUserRole } = useAuth();

  const createForm = useForm({
    defaultValues: {
      email: "",
      displayName: "",
      password: "",
      role: "User" as "Admin" | "User"
    }
  });

  const editForm = useForm({
    defaultValues: {
      displayName: "",
      role: "User" as "Admin" | "User"
    }
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser && isEditDialogOpen) {
      editForm.reset({
        displayName: selectedUser.displayName || "",
        role: selectedUser.isAdmin ? "Admin" : "User"
      });
    }
  }, [selectedUser, isEditDialogOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await fetchAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateUser = async (data: any) => {
    try {
      await createUser(data);
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dibuat"
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pengguna",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUser = async (data: any) => {
    if (!selectedUser) return;

    try {
      const updatedUser = {
        ...selectedUser,
        displayName: data.displayName,
      };

      await updateUser(selectedUser.id, updatedUser);
      
      // Update role if changed
      if ((data.role === "Admin" && !selectedUser.isAdmin) || 
          (data.role === "User" && selectedUser.isAdmin)) {
        await setUserRole(selectedUser.id, data.role);
      }
      
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil diperbarui"
      });
      setIsEditDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui pengguna",
        variant: "destructive"
      });
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await verifyUser(userId);
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil diverifikasi"
      });
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memverifikasi pengguna",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus"
      });
      setIsDeleteDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus pengguna",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    return (
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <AdminLayout pageTitle="Kelola Pengguna">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Pengguna</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Tambah Pengguna
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" required />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" required />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                {...field}
                              >
                                <option value="User">User</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit">Simpan</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Cari pengguna..."
                className="pl-10 max-w-sm"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verifikasi</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center space-x-3">
                            <Avatar>
                              {user.photoURL ? (
                                <AvatarImage src={user.photoURL} alt={user.displayName || ""} />
                              ) : null}
                              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.displayName || 'Anonymous'}</span>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge variant="default">Admin</Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.isVerified ? (
                              <Badge variant="success" className="bg-green-500">Terverifikasi</Badge>
                            ) : (
                              <Badge variant="destructive">Belum Verifikasi</Badge>
                            )}
                          </TableCell>
                          <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!user.isVerified && !user.isAdmin && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => handleVerifyUser(user.id)}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          {searchTerm ? "Tidak ada pengguna yang sesuai dengan pencarian" : "Belum ada pengguna"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          {...field}
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Dialog */}
      {selectedUser && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Pengguna</DialogTitle>
            </DialogHeader>
            <div className="py-3">
              <p>Apakah Anda yakin ingin menghapus pengguna <strong>{selectedUser.displayName || selectedUser.email}</strong>?</p>
              <p className="text-sm text-muted-foreground mt-1">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
              >
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
