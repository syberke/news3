
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Calendar, Heart, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NewsletterSubscribe from "@/components/newsletter/NewsletterSubscribe";
import CommentSection from "@/components/comments/CommentSection";
import { useAuth } from "@/context/AuthContext";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  imageUrl: string;
  likes?: number;
  commentsCount?: number;
}

const NewsDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-10 w-32" />
      </div>
      
      <Card className="overflow-hidden border-none shadow-lg">
        <Skeleton className="h-[300px] md:h-[400px] w-full" />
        
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4 mt-2" />
          </div>
          
          <Skeleton className="h-1 w-full" />
          
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </div>
          
          <div className="flex justify-between pt-6">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsCount, setCommentsCount] = useState(0);
  const db = getFirestore();
  const { toast } = useToast();
  const { user, hasLikedArticle, addLikedArticle } = useAuth();

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
        const newsData = {
          id: newsSnapshot.id,
          ...newsSnapshot.data()
        } as NewsItem;
        
        setNews(newsData);
        // Initialize likes count
        setCommentsCount(newsData.commentsCount || 0);
      } else {
        console.error("News not found");
      }
    } catch (error) {
      console.error("Error fetching news detail:", error);
    } finally {
      // Simulate longer loading for better UX
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
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
      toast({
        title: "Link copied",
        description: "Link copied to clipboard!"
      });
    }
  };

  const handleLike = async () => {
    if (!id || !user) {
      toast({
        title: "Login Required",
        description: "Please login to like articles",
        variant: "destructive"
      });
      return;
    }
    
    if (hasLikedArticle(id)) {
      toast({
        title: "Already liked",
        description: "You've already liked this article",
      });
      return;
    }
    
    try {
      // Update likes in Firestore
      const newsRef = doc(db, "news", id);
      await updateDoc(newsRef, {
        likes: increment(1)
      });
      
      // Add to user's liked articles
      await addLikedArticle(id);
      
      // Update the UI
      setNews(prevNews => {
        if (!prevNews) return null;
        return {
          ...prevNews,
          likes: (prevNews.likes || 0) + 1
        };
      });
      
      toast({
        title: "Liked!",
        description: "Thanks for liking this article"
      });
    } catch (error) {
      console.error("Error updating likes:", error);
      toast({
        title: "Error",
        description: "Failed to like this article",
        variant: "destructive"
      });
    }
  };

  const handleCommentCountChange = (count: number) => {
    setCommentsCount(count);
    
    // Update commentsCount in the news document if we have news
    if (id && news) {
      const newsRef = doc(db, "news", id);
      updateDoc(newsRef, {
        commentsCount: count
      }).catch(error => {
        console.error("Error updating comment count:", error);
      });
    }
  };

  const isLiked = id ? hasLikedArticle(id) : false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {isLoading ? (
          <NewsDetailSkeleton />
        ) : !news ? (
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
        ) : (
          <div className="bg-gradient-subtle py-8">
            <div className="container mx-auto px-4 max-w-4xl">
              <Button variant="outline" className="mb-6 hover:bg-background/80" asChild>
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
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-2"
                        onClick={handleLike}
                        disabled={isLiked}
                      >
                        <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{isLiked ? 'Liked' : 'Like'}</span>
                      </Button>
                      <span className="text-muted-foreground">{(news.likes || 0)} likes</span>
                    </div>
                    
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={handleShare}
                    >
                      <Share className="h-5 w-5" />
                      <span>Share</span>
                    </Button>
                  </div>
                  
                  <Separator className="my-8" />
                  
                  {/* Comments Section */}
                  {id && (
                    <CommentSection 
                      newsId={id} 
                      onCommentCountChange={handleCommentCountChange} 
                    />
                  )}
                </CardContent>
              </Card>

              <div className="mt-12">
                <NewsletterSubscribe />
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default NewsDetail;
