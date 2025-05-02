
import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Plus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  where,
  getCountFromServer
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
  createdAt: string;
}

const AdminCategories = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [currentCategoryId, setCurrentCategoryId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const db = getFirestore();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesCollection = collection(db, "categories");
      const categoriesSnapshot = await getDocs(
        query(categoriesCollection, orderBy("createdAt", "desc"))
      );
      
      // Get all categories
      const categoriesList = await Promise.all(
        categoriesSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          // Get post count for each category
          const newsCollection = collection(db, "news");
          const newsQuery = query(
            newsCollection, 
            where("category", "==", data.name)
          );
          const newsSnapshot = await getCountFromServer(newsQuery);
          const postCount = newsSnapshot.data().count;
          
          return {
            id: doc.id,
            ...data,
            postCount
          } as Category;
        })
      );
      
      setCategories(categoriesList);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data kategori",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName) {
      toast({
        title: "Error",
        description: "Nama kategori harus diisi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate slug from name if not provided
      const slug = categorySlug || categoryName.toLowerCase().replace(/\s+/g, "-");
      
      const today = new Date().toISOString().split('T')[0];
      
      await addDoc(collection(db, "categories"), {
        name: categoryName,
        slug,
        createdAt: today
      });
      
      toast({
        title: "Berhasil",
        description: "Kategori berhasil ditambahkan",
      });
      
      // Reset form
      setCategoryName("");
      setCategorySlug("");
      setIsAddDialogOpen(false);
      
      // Refresh categories list
      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan kategori",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setCurrentCategoryId(category.id);
    setCategoryName(category.name);
    setCategorySlug(category.slug);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!categoryName) {
      toast({
        title: "Error",
        description: "Nama kategori harus diisi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate slug from name if not provided
      const slug = categorySlug || categoryName.toLowerCase().replace(/\s+/g, "-");
      
      const categoryRef = doc(db, "categories", currentCategoryId);
      await updateDoc(categoryRef, {
        name: categoryName,
        slug
      });
      
      toast({
        title: "Berhasil",
        description: "Kategori berhasil diperbarui",
      });
      
      // Reset form
      setCategoryName("");
      setCategorySlug("");
      setCurrentCategoryId("");
      setIsEditDialogOpen(false);
      
      // Refresh categories list
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui kategori",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (categoryId: string) => {
    setCurrentCategoryId(categoryId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    setIsLoading(true);
    try {
      const categoryRef = doc(db, "categories", currentCategoryId);
      await deleteDoc(categoryRef);
      
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
      });
      
      setCurrentCategoryId("");
      setIsDeleteDialogOpen(false);
      
      // Refresh categories list
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus kategori",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout pageTitle="Kategori">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kategori..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kategori
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Jumlah Artikel</TableHead>
                <TableHead>Dibuat Pada</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>{category.postCount}</TableCell>
                    <TableCell>{category.createdAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditClick(category)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteClick(category.id)}
                          >
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {isLoading ? "Memuat data..." : "Tidak ada kategori"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
            <DialogDescription>
              Masukkan informasi kategori baru di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Kategori</Label>
              <Input
                id="name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Masukkan nama kategori"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (opsional)</Label>
              <Input
                id="slug"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                placeholder="Masukkan slug"
              />
              <p className="text-xs text-muted-foreground">
                Slug akan dibuat otomatis jika tidak diisi.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddCategory} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>
              Perbarui informasi kategori.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nama Kategori</Label>
              <Input
                id="edit-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateCategory} disabled={isLoading}>
              {isLoading ? "Memperbarui..." : "Perbarui"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={isLoading}>
              {isLoading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;
