
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Hero = () => {
  return (
    <div className="bg-gradient-subtle py-16 md:py-24 border-b">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gradient">
          Berita Terbaru dan Terpercaya
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Temukan berita terkini dari berbagai kategori dalam satu platform.
          Berita yang akurat, terpercaya, dan selalu terupdate.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/">
              Jelajahi Berita
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="group">
            <Search className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            Cari Berita
          </Button>
        </div>
        
        <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background/60 backdrop-blur-sm p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-lg">Teknologi</h3>
            <p className="text-muted-foreground text-sm">100+ artikel</p>
          </div>
          <div className="bg-background/60 backdrop-blur-sm p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-lg">Bisnis</h3>
            <p className="text-muted-foreground text-sm">250+ artikel</p>
          </div>
          <div className="bg-background/60 backdrop-blur-sm p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-lg">Kesehatan</h3>
            <p className="text-muted-foreground text-sm">180+ artikel</p>
          </div>
          <div className="bg-background/60 backdrop-blur-sm p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-lg">Olahraga</h3>
            <p className="text-muted-foreground text-sm">300+ artikel</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
