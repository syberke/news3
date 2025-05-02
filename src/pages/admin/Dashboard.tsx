
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getFirestore, collection, getDocs, query, where, orderBy, getCountFromServer } from "firebase/firestore";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalArticles: 0,
    totalCategories: 0,
    totalVisits: 0,
  });
  const [analyticsData, setAnalyticsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const db = getFirestore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get total users count
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getCountFromServer(usersCollection);
      const totalUsers = usersSnapshot.data().count;
      
      // Get total articles count
      const newsCollection = collection(db, "news");
      const articlesSnapshot = await getCountFromServer(newsCollection);
      const totalArticles = articlesSnapshot.data().count;
      
      // Get total categories count
      const categoriesCollection = collection(db, "categories");
      const categoriesSnapshot = await getCountFromServer(categoriesCollection);
      const totalCategories = categoriesSnapshot.data().count;
      
      // Get visits data (if you have a visits collection)
      // For now, let's use a mock value
      const totalVisits = 12234; // This would be replaced by actual data
      
      setDashboardStats({
        totalUsers,
        totalArticles,
        totalCategories,
        totalVisits
      });

      // Generate analytics data
      const today = new Date();
      const analyticsData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setMonth(today.getMonth() - i);
        
        analyticsData.push({
          name: date.toLocaleString('default', { month: 'short' }),
          users: Math.floor(Math.random() * 300) + 100,
          posts: Math.floor(Math.random() * 200) + 50
        });
      }
      
      setAnalyticsData(analyticsData);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Dashboard">
      <div className="grid gap-6">
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Pengguna
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +20% dari bulan lalu
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Artikel Dibuat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalArticles}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% dari bulan lalu
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Kategori
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalCategories}</div>
                  <p className="text-xs text-muted-foreground">
                    +2 kategori baru
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Kunjungan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalVisits}</div>
                  <p className="text-xs text-muted-foreground">
                    +18% dari bulan lalu
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Pengguna Baru</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Artikel Dibuat</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="posts"
                        stroke="#82ca9d"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistik Lanjutan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Data analitik lanjutan akan ditampilkan di sini.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
