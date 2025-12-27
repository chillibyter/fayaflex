import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Fingerprint, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { authenticateWithPasskey } from "@/lib/passkey";
import heroBanner from "@assets/ufc-hero-banner.png";

export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginMutation.mutateAsync({ username: loginUsername, password: loginPassword });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerMutation.mutateAsync({
      username: registerUsername,
      password: registerPassword,
      email: email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  };

  const passkeyLoginMutation = useMutation({
    mutationFn: async (username: string) => {
      const result = await authenticateWithPasskey(username);
      return result.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Login successful!",
        description: "You've been authenticated with your passkey.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Passkey login failed",
        description: error.message || "Could not authenticate with passkey. Please try password login.",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', '/api/auth/forgot-password', { email });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Check your email",
        description: data.message,
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await forgotPasswordMutation.mutateAsync(forgotPasswordEmail);
  };

  const handlePasskeyLogin = async () => {
    if (!loginUsername) {
      toast({
        title: "Username required",
        description: "Please enter your username to use passkey login.",
        variant: "destructive",
      });
      return;
    }
    await passkeyLoginMutation.mutateAsync(loginUsername);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-green-50/50 dark:bg-green-950/20 pt-8 pb-12 px-4">
      {/* Hero Banner */}
      <div className="w-full max-w-md mb-6">
        <Card className="overflow-hidden border-0 shadow-lg">
          <img 
            src={heroBanner} 
            alt="Welcome to Ultimate Fitness Challenge" 
            className="w-full h-auto"
            data-testid="img-hero-banner"
          />
        </Card>
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-md shadow-lg border border-gray-100 dark:border-gray-800">
        <CardHeader className="text-center pb-2">
          <h2 className="text-xl font-semibold text-foreground" data-testid="text-auth-title">
            {showForgotPassword ? "Reset Password" : (isLoginView ? "Welcome Back" : "Create Account")}
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoginView ? (
            showForgotPassword ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1 p-0 h-auto text-muted-foreground"
                  onClick={() => setShowForgotPassword(false)}
                  data-testid="button-back-to-login"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Button>
                <p className="text-sm text-muted-foreground">
                  Enter your email to receive a password reset link
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      data-testid="input-forgot-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="rounded-[10px] border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <Button
                    type="submit"
                    data-testid="button-send-reset"
                    className="w-full bg-[#00A63E] hover:bg-[#009035] text-white rounded-[10px]"
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      data-testid="input-login-username"
                      type="text"
                      placeholder=""
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                      minLength={3}
                      className="rounded-[10px] border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      data-testid="input-login-password"
                      type="password"
                      placeholder=""
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      minLength={6}
                      className="rounded-[10px] border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-[#00A63E] hover:text-[#009035] hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                      data-testid="button-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    data-testid="button-login"
                    className="w-full bg-[#00A63E] hover:bg-[#009035] text-white rounded-[10px]"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Loading..." : "Sign In"}
                  </Button>
                </form>

                <Button
                  type="button"
                  variant="outline"
                  data-testid="button-passkey-login"
                  className="w-full gap-2 rounded-[10px] border-gray-300 dark:border-gray-700"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoginMutation.isPending}
                >
                  <Fingerprint className="w-4 h-4" />
                  {passkeyLoginMutation.isPending ? "Authenticating..." : "Sign in with Passkey"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-[#00A63E] hover:text-[#009035] hover:underline font-medium"
                    onClick={() => setIsLoginView(false)}
                    data-testid="button-switch-to-signup"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    data-testid="input-register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                    minLength={3}
                    className="rounded-[10px] border-gray-300 dark:border-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    data-testid="input-register-password"
                    type="password"
                    placeholder="Create a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-[10px] border-gray-300 dark:border-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-[10px] border-gray-300 dark:border-gray-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name (optional)</Label>
                    <Input
                      id="firstName"
                      data-testid="input-firstname"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-[10px] border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name (optional)</Label>
                    <Input
                      id="lastName"
                      data-testid="input-lastname"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-[10px] border-gray-300 dark:border-gray-700"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  data-testid="button-register"
                  className="w-full bg-[#00A63E] hover:bg-[#009035] text-white rounded-[10px]"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Loading..." : "Create Account"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-[#00A63E] hover:text-[#009035] hover:underline font-medium"
                  onClick={() => setIsLoginView(true)}
                  data-testid="button-switch-to-login"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
