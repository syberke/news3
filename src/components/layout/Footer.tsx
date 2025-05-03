
import { Link } from "react-router-dom";
import { FileText, Heart, Github } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                FireNews
              </span>
            </div>
            <p className="text-muted-foreground">
              Portal berita terkini yang menyajikan informasi aktual dan terpercaya dari berbagai kategori.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Kategori Populer</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Teknologi
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Bisnis
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Kesehatan
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Olahraga
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Informasi</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} FireNews. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              <Github className="h-5 w-5" />
            </a>
            <span className="text-sm text-muted-foreground flex items-center">
              Made with <Heart className="h-3 w-3 mx-1 text-red-500 fill-red-500" /> in Indonesia
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
