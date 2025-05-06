
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/hero/Hero";
import NewsFeed from "@/components/news/NewsFeed";
import NewsletterSubscribe from "@/components/newsletter/NewsletterSubscribe";
import OurTeam from "@/components/team/OurTeam";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  sendPasswordResetEmail, 
  signOut
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import AuthForm from "@/components/auth/AuthForm";
import { auth } from "@/services/firebase";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail } from "lucide-react";

// Admin account credentials - make sure these match the email in AuthContext
const ADMIN_EMAIL = "admin@firenews.com";
const ADMIN_PASSWORD = "Admin123!";

const Index = () => {
  const { toast } = useToast();
  const { user, isAdmin, isVerified, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if the user is logging out
    if (location.search.includes("signout=true")) {
      handleLogout();
    }
  }, [location]);

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Berhasil",
        description: "Login berhasil",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: "Berhasil",
        description: "Login dengan Google berhasil",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGithubLogin = async () => {
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: "Berhasil",
        description: "Login dengan GitHub berhasil",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Berhasil",
        description: "Registrasi berhasil. Silahkan periksa email Anda untuk verifikasi.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Berhasil",
        description: "Email reset password telah dikirim",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Berhasil",
        description: "Logout berhasil",
      });
      navigate('/', { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResendVerification = async () => {
    await sendVerificationEmail();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <AuthForm
          onEmailLogin={handleEmailLogin}
          onGoogleLogin={handleGoogleLogin}
          onGithubLogin={handleGithubLogin}
          onRegister={handleRegister}
          onResetPassword={handleResetPassword}
        />
        <div className="fixed bottom-2 text-xs text-gray-500">
          <p>Admin login: {ADMIN_EMAIL} / {ADMIN_PASSWORD}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Verification Banner */}
      {user && !isAdmin && !isVerified && (
        <div className="bg-amber-50 border-amber-200 border-b">
          <div className="container mx-auto px-4 py-3">
            <Alert variant="warning" className="bg-transparent border-0 p-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800">
                Your account is not verified
              </AlertTitle>
              <AlertDescription className="text-amber-700 flex items-center gap-3">
                <span>Please verify your email to access all features.</span>
                <Button 
                  onClick={handleResendVerification} 
                  variant="outline" 
                  size="sm"
                  className="border-amber-500 hover:bg-amber-100"
                >
                  <Mail className="h-4 w-4 mr-2" /> Resend verification email
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      
      <Hero />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          {isAdmin && (
            <div className="mb-6">
              <Link to="/admin">
                <Button>
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          )}
          <NewsFeed />
          <OurTeam />
          <NewsletterSubscribe />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
