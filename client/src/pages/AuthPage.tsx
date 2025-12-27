import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, TrendingUp, Users, Trophy, Fingerprint, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { authenticateWithPasskey } from "@/lib/passkey";

export default function AuthPage() {
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
    <div className="min-h-screen flex bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-background">
      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary p-2 rounded-lg">
                <Dumbbell className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary">UFC</h1>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                {showForgotPassword ? (
                  <>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 p-0 h-auto"
                        onClick={() => setShowForgotPassword(false)}
                        data-testid="button-back-to-login"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to login
                      </Button>
                      <CardTitle className="text-2xl">Reset Password</CardTitle>
                      <CardDescription>Enter your email to receive a password reset link</CardDescription>
                    </div>
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
                        />
                      </div>

                      <Button
                        type="submit"
                        data-testid="button-send-reset"
                        className="w-full"
                        disabled={forgotPasswordMutation.isPending}
                      >
                        {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">Welcome back</CardTitle>
                      <CardDescription>Enter your credentials to access your account</CardDescription>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username">Username</Label>
                        <Input
                          id="login-username"
                          data-testid="input-login-username"
                          type="text"
                          placeholder="Enter your username"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          required
                          minLength={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Password</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            className="p-0 h-auto text-sm text-muted-foreground"
                            onClick={() => setShowForgotPassword(true)}
                            data-testid="button-forgot-password"
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <Input
                          id="login-password"
                          data-testid="input-login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>

                      <Button
                        type="submit"
                        data-testid="button-login"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Loading..." : "Sign In"}
                      </Button>
                    </form>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      data-testid="button-passkey-login"
                      className="w-full gap-2"
                      onClick={handlePasskeyLogin}
                      disabled={passkeyLoginMutation.isPending}
                    >
                      <Fingerprint className="w-4 h-4" />
                      {passkeyLoginMutation.isPending ? "Authenticating..." : "Sign in with Passkey"}
                    </Button>
                  </>
                )}
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Create an account</CardTitle>
                  <CardDescription>Join the ultimate fitness competition</CardDescription>
                </div>
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
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    data-testid="button-register"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Loading..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-500 to-green-600 items-center justify-center p-12">
        <div className="max-w-lg space-y-8 text-center text-white">
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Track. Compete. Achieve.
          </h2>
          <p className="text-lg text-green-50">
            Join teams, track your fitness activities, and compete in monthly challenges.
            Burn calories, crush goals, and climb the leaderboard!
          </p>
          
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-white">Track Progress</h3>
              <p className="text-sm text-green-100">
                Log calories, steps, and workouts daily
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-white">Join Teams</h3>
              <p className="text-sm text-green-100">
                Compete with up to 20 teammates
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-white">Win Challenges</h3>
              <p className="text-sm text-green-100">
                Climb monthly leaderboards
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
