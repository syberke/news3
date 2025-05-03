
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { getFirestore, doc, updateDoc, increment } from "firebase/firestore";

interface NewsCardProps {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string;
  date: string;
  likes?: number;
}

const NewsCard = ({ id, title, content, category, imageUrl, date, likes = 0 }: NewsCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(likes);
  const db = getFirestore();

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event propagation
    
    if (!liked) {
      try {
        // Update likes in Firestore
        const newsRef = doc(db, "news", id);
        await updateDoc(newsRef, {
          likes: increment(1)
        });
        
        setLikesCount(prev => prev + 1);
        setLiked(true);
      } catch (error) {
        console.error("Error updating likes:", error);
      }
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border hover:border-primary/20 h-full flex flex-col">
      <Link to={`/news/${id}`} className="overflow-hidden">
        <div className="relative h-48 overflow-hidden group">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm font-medium">
              {category}
            </Badge>
          </div>
        </div>
      </Link>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(date)}
          </span>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0" 
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <span className="text-xs text-muted-foreground">{likesCount}</span>
          </div>
        </div>
        <CardTitle className="line-clamp-2 hover:text-primary">
          <Link to={`/news/${id}`}>{title}</Link>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-4 flex-grow">
        <p className="text-muted-foreground line-clamp-3">{content}</p>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button variant="ghost" className="p-0 h-auto text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all" asChild>
          <Link to={`/news/${id}`}>
            Read more <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewsCard;
