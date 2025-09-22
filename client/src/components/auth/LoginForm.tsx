import { useState, useEffect } from "react"; // Import useEffect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Fuel } from "lucide-react";
import SignupForm from "./SignupForm";
import { useLocation } from "wouter"; // Assuming you are using Wouter for routing

export default function LoginForm() {
  const [showSignup, setShowSignup] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle, user, userStatus } = useAuth(); // Assuming useAuth provides user and userStatus
  const { toast } = useToast();
  const setLocation = useLocation()[1]; // Get the setLocation function from Wouter

  // Effect to handle redirection based on user status
  useEffect(() => { // Correctly use useEffect
    if (user) {
      if (userStatus === "pending") {
        setLocation("/approval-pending"); // Redirect to pending approval page
      } else if (userStatus === "verified") {
        setLocation("/dashboard"); // Redirect to dashboard if verified
      }
    }
  }, [user, userStatus, setLocation]); // Include setLocation in dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginSuccess = await login(username, password);
      if (!loginSuccess) {
        // This block will handle cases where login function itself returns false or throws an error
        // The error handling within login() should ideally toast the specific message
        // But we add a generic fallback here if needed.
        toast({
          title: "Login failed",
          description: "An unexpected error occurred during login.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      if (error.message.includes("pending approval")) {
        setLocation("/approval-pending");
        return;
      }
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // The effect hook above will handle redirection based on userStatus after google sign-in
    } catch (error: any) {
      if (error.message?.includes("approval") || error.message?.includes("pending")) {
        toast({
          title: "Account Pending Approval",
          description: "Your account is waiting for administrator approval. Please contact your administrator.",
          variant: "destructive",
        });
        setLocation("/approval-pending"); // Redirect to pending approval page
      } else {
        toast({
          title: "Google sign-in failed",
          description: error.message || "Please try again or use username/password.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
  };

  // If user is already logged in and approved, redirect them
  if (user && userStatus === "verified") {
    // This might cause a redirect loop if not handled carefully.
    // The useEffect should be sufficient, but this is an extra safeguard.
    // Consider removing this if useEffect handles it perfectly.
    // setLocation('/dashboard');
    // return null; // Or a loading spinner
  }

  // If user is pending approval, show the pending page
  if (userStatus === "pending") {
    setLocation("/approval-pending");
    return null; // Render nothing while redirecting
  }

  // If user is logged in but status is not yet determined or null, show loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="text-center text-white">Loading and verifying status...</div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm border shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Fuel className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground" data-testid="login-title">FuelFlow Login</h2>
            <p className="text-muted-foreground">Petrol Pump Accounting System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-card-foreground mb-2">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full"
                data-testid="input-username"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full"
                data-testid="input-password"
                required
              />
            </div>


            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Logging in..." : "Login to System"}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleSignIn}
              disabled={isLoading || !isFirebaseConfigured}
              data-testid="google-signin-button"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>



          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="text-primary hover:underline font-medium"
              >
                Sign up here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {showSignup && <SignupForm onBack={() => setShowSignup(false)} />}
    </div>
  );
}