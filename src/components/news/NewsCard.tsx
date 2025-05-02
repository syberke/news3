
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface NewsCardProps {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string;
  date: string;
}

const NewsCard = ({ id, title, content, category, imageUrl, date }: NewsCardProps) => {
  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
