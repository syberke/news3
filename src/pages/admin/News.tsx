
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { FileText, Edit, Trash2, Plus, Search } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  where
} from "firebase/firestore";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { useTheme } from "@/context/ThemeContext";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  date: string;
  imageUrl: string;
  likes?: number;
}

const AdminNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Technology");
  const [status, setStatus] = useState("Draft");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentNewsId, setCurrentNewsId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  
  const db = getFirestore();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, []);

  const fetchNews = async () => {
    try {
      const newsCollection = collection(db, "news");
      const newsSnapshot = await getDocs(query(newsCollection, orderBy("date", "desc")));
      const newsList = newsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[];
      setNews(newsList);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data berita",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesCollection = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesCollection);
      
      const categoriesList = categoriesSnapshot.docs.map(doc => doc.data().name);
      setCategories([...new Set(categoriesList)]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddNews = async () => {
    if (!title || !content || !category) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = "";
      
      // Upload image to Cloudinary if selected
      if (selectedFile) {
        imageUrl = await uploadToCloudinary(selectedFile);
      } else {
        // Default image if none selected
        imageUrl = "https://source.unsplash.com/random/800x600/?news";
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      await addDoc(collection(db, "news"), {
        title,
        content,
        category,
        status,
        date: today,
        imageUrl,
        likes: 0 // Initialize likes counter
      });
      
      toast({
        title: "Berhasil",
        description: "Berita berhasil ditambahkan",
      });
      
      // Reset form
      setTitle("");
      setContent("");
      setCategory("Technology");
      setStatus("Draft");
      setSelectedFile(null);
      setPreviewImage(null);
      setIsAddDialogOpen(false);
      
      // Refresh news list
      fetchNews();
    } catch (error) {
      console.error("Error adding news:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan berita",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (newsItem: NewsItem) => {
    setCurrentNewsId(newsItem.id);
    setTitle(newsItem.title);
    setContent(newsItem.content);
    setCategory(newsItem.category);
    setStatus(newsItem.status);
    setCurrentImageUrl(newsItem.imageUrl);
    setPreviewImage(newsItem.imageUrl);
    setIsEditDialogOpen(true);
  };

  const handleUpdateNews = async () => {
    if (!title || !content || !category) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let updatedNews: Partial<NewsItem> = {
        title,
        content,
        category,
        status,
      };

      // Upload new image if selected
      if (selectedFile) {
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(selectedFile);
        updatedNews.imageUrl = imageUrl;
      }
      
      const newsRef = doc(db, "news", currentNewsId);
      await updateDoc(newsRef, updatedNews);
      
      toast({
        title: "Berhasil",
        description: "Berita berhasil diperbarui",
      });
      
      // Reset form
      setTitle("");
      setContent("");
      setCategory("Technology");
      setStatus("Draft");
      setSelectedFile(null);
      setPreviewImage(null);
      setCurrentImageUrl(null);
      setCurrentNewsId("");
      setIsEditDialogOpen(false);
      
      // Refresh news list
      fetchNews();
    } catch (error) {
      console.error("Error updating news:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui berita",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (newsId: string) => {
    setCurrentNewsId(newsId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteNews = async () => {
    setIsLoading(true);
    try {
      const newsRef = doc(db, "news", currentNewsId);
      await deleteDoc(newsRef);
      
      toast({
        title: "Berhasil",
        description: "Berita berhasil dihapus",
      });
      
      setCurrentNewsId("");
      setIsDeleteDialogOpen(false);
      
      // Refresh news list
      fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus berita",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout pageTitle="Kelola Berita">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Berita</CardTitle>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Berita
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Cari berita..."
                className="pl-10 max-w-sm"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNews.length > 0 ? (
                    filteredNews.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {item.title}
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.likes || 0}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteClick(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        {searchTerm ? "Tidak ada berita yang sesuai dengan pencarian" : "Belum ada berita"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add News Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tambah Berita Baru</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk menambahkan berita baru
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Judul Berita</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul berita"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Konten</Label>
              <Textarea
                id="content"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Masukkan konten berita"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Environment">Environment</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Gambar Berita (Cloudinary)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {previewImage && (
                <div className="mt-2">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-h-40 rounded"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddNews} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit News Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Berita</DialogTitle>
            <DialogDescription>
              Perbarui informasi berita
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Judul Berita</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-content">Konten</Label>
              <Textarea
                id="edit-content"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Environment">Environment</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image">Gambar Berita (Cloudinary)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {previewImage && (
                <div className="mt-2">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-h-40 rounded"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateNews} disabled={isLoading}>
              {isLoading ? "Memperbarui..." : "Perbarui"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete News Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Berita</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus berita ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteNews} disabled={isLoading}>
              {isLoading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminNews;
