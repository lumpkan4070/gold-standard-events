import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import authImage from "@/assets/ladies-at-bar.jpg";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
const navigate = useNavigate();
const { toast } = useToast();

// Forgot password & recovery state
const [isResetOpen, setIsResetOpen] = useState(false);
const [resetEmail, setResetEmail] = useState("");
const [isSendingReset, setIsSendingReset] = useState(false);
const [isResetMode, setIsResetMode] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  useEffect(() => {
    // Detect password recovery mode via redirect flag
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      setIsResetMode(true);
    }

    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !isResetMode) {
        navigate("/");
      }
    };
    checkUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session && !isResetMode) {
          navigate("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, isResetMode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Sign in failed",
            description: "Invalid email or password. Please check your credentials and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResendEmail(false); // Reset resend state

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        setSignupEmail(email);
        setShowResendEmail(true);
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);
    try {
      const redirectUrl = `${window.location.origin}/auth?reset=1`;
      const targetEmail = (resetEmail || email).trim();
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl,
      });
      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email sent",
          description: "Check your inbox for the password reset link.",
        });
        setIsResetOpen(false);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingEmail(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) {
        toast({
          title: "Resend failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email sent",
          description: "Check your inbox for the verification email.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both password fields match.",
        variant: "destructive",
      });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Password updated", description: "Redirecting..." });
        window.location.href = "/";
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not update password.", variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authImage})` }}
      />
      <div className="absolute inset-0 bg-black/80" />
      <Card className="relative z-10 w-full max-w-md luxury-card backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center">
          <div className="victory-text-gradient text-3xl font-bold mb-2">
            Victory
          </div>
          <CardTitle className="text-foreground">Welcome</CardTitle>
          <CardDescription className="text-muted-foreground">
            Access your Victory Bistro Ultra Lounge account
          </CardDescription>
        </CardHeader>
        <CardContent>
{isResetMode ? (
            <div className="space-y-4">
              <CardTitle className="text-foreground">Reset your password</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter and confirm your new password below.
              </CardDescription>
              <form onSubmit={handleUpdatePassword} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-input border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm new password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-input border-primary/20 focus:border-primary"
                  />
                </div>
                <Button type="submit" disabled={isUpdatingPassword} className="w-full luxury-button">
                  {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
                  Cancel
                </Button>
              </form>
            </div>
          ) : (
            <>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        className="text-xs text-primary hover:text-primary/80 underline"
                        onClick={() => {
                          setResetEmail(email);
                          setIsResetOpen(true);
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full luxury-button"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="First"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="bg-input border-primary/20 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Last"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="bg-input border-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full luxury-button"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                    
                    {showResendEmail && (
                      <div className="space-y-2 p-3 bg-muted/50 rounded-md border border-primary/20">
                        <p className="text-sm text-muted-foreground text-center">
                          Didn't receive the verification email?
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResendVerification}
                          disabled={isResendingEmail}
                          className="w-full border-primary/20 text-primary hover:bg-primary/10"
                        >
                          {isResendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Resend Verification Email
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/")}
                      className="w-full border-primary/20 text-primary hover:bg-primary/10"
                    >
                      Back to Home
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Reset password dialog */}
              <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset password</DialogTitle>
                    <DialogDescription>
                      Enter your email and we'll send you a secure link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSendResetEmail} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSendingReset} className="w-full luxury-button">
                        {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send reset link
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}

          
          {/* Privacy Policy Footer */}
          <div className="mt-6 pt-4 border-t border-primary/20 text-center">
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link 
                to="/privacy" 
                className="text-primary hover:text-primary/80 victory-transition underline"
              >
                Privacy Policy
              </Link>
              . We protect your data with industry-standard security measures.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;