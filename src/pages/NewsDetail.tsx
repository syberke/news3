
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Calendar, Tag, Heart, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/layout/Navbar";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  imageUrl: string;
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    if (id) {
      fetchNewsDetail(id);
    }
  }, [id]);

  const fetchNewsDetail = async (newsId: string) => {
    try {
      setIsLoading(true);
      const newsDoc = doc(db, "news", newsId);
      const newsSnapshot = await getDoc(newsDoc);
      
      if (newsSnapshot.exists()) {
        setNews({
          id: newsSnapshot.id,
          ...newsSnapshot.data()
        } as NewsItem);
      } else {
        console.error("News not found");
      }
    } catch (error) {
      console.error("Error fetching news detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: news?.title,
        text: news?.content.substring(0, 100) + '...',
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-[200px] mb-4" />
          <Skeleton className="h-[300px] w-full mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </>
    );
  }

  if (!news) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">News not found</h1>
          <p className="mb-6">The news article you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="outline" className="mb-6" asChild>
            <Link to="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to News
            </Link>
          </Button>

          <Card className="overflow-hidden border-none shadow-lg">
            <div className="w-full h-[300px] md:h-[400px] overflow-hidden">
              <img 
                src={news.imageUrl} 
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>

            <CardContent className="p-6 md:p-8">
              <div className="space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <Badge variant="outline" className="text-sm">{news.category}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(news.date)}
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold md:text-4xl">{news.title}</h1>
                
                <Separator />
                
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap leading-relaxed">{news.content}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-10">
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2"
                  onClick={() => setLiked(!liked)}
                >
                  <Heart className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{liked ? 'Liked' : 'Like'}</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleShare}
                >
                  <Share className="h-5 w-5" />
                  <span>Share</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default NewsDetail;
