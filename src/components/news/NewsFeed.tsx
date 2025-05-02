
import { useState, useEffect } from "react";
import NewsCard from "./NewsCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search news..."
          className="pl-10"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleCategoryClick(null)}
          className={`px-4 py-2 rounded-full text-sm ${
            activeCategory === null
              ? "bg-primary text-white"
              : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          All
        </button>
        {getUniqueCategories().map(category => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`px-4 py-2 rounded-full text-sm ${
              activeCategory === category
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-5 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((news) => (
                <NewsCard key={news.id} {...news} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-xl font-medium">No news found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try a different search term" : "Check back later for updates"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NewsFeed;
