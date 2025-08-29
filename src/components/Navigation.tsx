import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, QrCode, Calendar, MessageCircle, User, LogOut, Shield, Phone, FileText, Dice1, Music, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NavigationProps {
  user?: any;
}

export const Navigation = ({ user: userProp }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setUser(userProp);
    
    // Check if user is admin
    const checkAdminRole = async () => {
      if (userProp) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userProp.id)
          .eq("role", "admin")
          .single();
        
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminRole();
  }, [userProp]);

  const cleanupAuthState = () => {
    // Remove standard auth tokens
    localStorage.removeItem('supabase.auth.token');
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleSignOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out (fallback if it fails)
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.warn('Global signout failed, continuing with cleanup:', err);
      }
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      
      // Force page reload for a clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clean up and redirect
      cleanupAuthState();
      toast({
        title: "Signed out",
        description: "You have been signed out (with cleanup)",
      });
      window.location.href = '/';
    }
  };

  const menuItems = [
    { label: "Home", href: "/", icon: null },
    { label: "Order", href: "/order", icon: QrCode },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "Contact", href: "/contact", icon: Phone },
    { label: "Privacy Policy", href: "/privacy", icon: FileText },
  ];

  // Add Games & Fun link for authenticated users
  if (user) {
    menuItems.splice(3, 0, { label: "Games & Fun", href: "/games", icon: Dice1 });
    menuItems.splice(4, 0, { label: "Song Requests", href: "/song-requests", icon: Heart });
  }

  if (user) {
    menuItems.push({ label: "Profile", href: "/profile", icon: User });
  }

  // Add Admin link if user is admin
  if (isAdmin) {
    menuItems.push({ label: "Admin", href: "/admin", icon: Shield });
  }

  return (
    <nav className="glass-effect fixed top-0 left-0 right-0 z-[9999] px-4 py-3 backdrop-blur-md bg-background/80 border-b border-primary/10 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="victory-text-gradient text-2xl font-bold tracking-wide">
            Victory
          </div>
          <div className="text-foreground/60 text-sm font-light">
            Bistro Ultra Lounge
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="text-foreground/80 hover:text-primary victory-transition font-medium"
            >
              {item.label}
            </Link>
          ))}
          
          {user ? (
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary hover:bg-primary/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button className="luxury-button text-sm px-6 py-2">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] glass-effect border-l border-primary/20">
            <div className="flex flex-col space-y-6 mt-6">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-foreground hover:text-primary victory-transition font-medium text-lg flex items-center space-x-3"
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <div className="pt-4 border-t border-primary/20">
                {user ? (
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button className="luxury-button w-full">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};