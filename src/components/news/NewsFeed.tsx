
import { useState, useEffect, useRef } from "react";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  imageUrl: string;
  status: string;
}

const NewsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const db = getFirestore();
  const newsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, []);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const newsCollection = collection(db, "news");
      // Only show published news
      const newsQuery = query(
        newsCollection, 
        where("status", "==", "Published"),
        orderBy("date", "desc")
      );
      const newsSnapshot = await getDocs(newsQuery);
      
      const newsList = newsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[];
      
      setNews(newsList);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setIsLoading(false);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryClick = (category: string | null) => {
    setActiveCategory(category);
  };

  const getUniqueCategories = () => {
    if (categories.length > 0) {
      return categories;
    }
    // Fallback to extracting from news if no categories collection
    const extractedCategories = news.map(item => item.category);
    return [...new Set(extractedCategories)];
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !activeCategory || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Animation variants for scroll animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari berita..."
          className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/60 focus:border-primary"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <ScrollArea className="max-h-16 overflow-auto pb-2 mb-6">
        <div className="flex flex-wrap gap-2 mb-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCategoryClick(null)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-300 ${
              activeCategory === null
                ? "bg-primary text-white shadow-md"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            Semua
          </motion.button>
          {getUniqueCategories().map(category => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-300 ${
                activeCategory === category
                  ? "bg-primary text-white shadow-md"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </ScrollArea>
      
      <div ref={newsRef}>
        {isLoading ? (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <NewsCardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <>
            {filteredNews.length > 0 ? (
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredNews.map((news) => (
                  <motion.div key={news.id} variants={itemVariants}>
                    <NewsCard {...news} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                <h3 className="text-2xl font-medium mb-2">Tidak ada berita ditemukan</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Coba kata kunci lain" : "Periksa kembali nanti untuk pembaruan"}
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
