import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, TrendingUp, Users, Trophy } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  
  // Migration state
  const [migrateFirstName, setMigrateFirstName] = useState("");
  const [migrateUsername, setMigrateUsername] = useState("");
  const [migratePassword, setMigratePassword] = useState("");
  const [migrateLastName, setMigrateLastName] = useState("");
  
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const migrateMutation = useMutation({
    mutationFn: async (data: { firstName: string; username: string; password: string; lastName?: string }) => {
      const res = await apiRequest("POST", "/api/migrate-account", data);
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Account migrated successfully!",
        description: "Your account has been updated. Welcome back!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Migration failed",
        description: error.message || "Could not migrate account. Please check your information.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginMutation.mutateAsync({ username: loginUsername, password: loginPassword });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerMutation.mutateAsync({
      username: registerUsername,
      password: registerPassword,
      email: email || null,
      firstName: firstName || null,
      lastName: lastName || null,
    });
  };

  const handleMigrate = async (e: React.FormEvent) => {
    e.preventDefault();
    await migrateMutation.mutateAsync({
      firstName: migrateFirstName,
      username: migrateUsername,
      password: migratePassword,
      lastName: migrateLastName || undefined,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Ultimate Fitness Challenge</h1>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
                <TabsTrigger value="migrate" data-testid="tab-migrate">Migrate</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
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
                    <Label htmlFor="login-password">Password</Label>
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
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      data-testid="input-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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

              <TabsContent value="migrate" className="space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Claim Your Account</CardTitle>
                  <CardDescription>
                    Migrate your old account by setting a username and password
                  </CardDescription>
                </div>
                <form onSubmit={handleMigrate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="migrate-firstname">Your First Name</Label>
                    <Input
                      id="migrate-firstname"
                      data-testid="input-migrate-firstname"
                      type="text"
                      placeholder="Enter your first name from old account"
                      value={migrateFirstName}
                      onChange={(e) => setMigrateFirstName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Must match your old account exactly (case-insensitive)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="migrate-username">New Username</Label>
                    <Input
                      id="migrate-username"
                      data-testid="input-migrate-username"
                      type="text"
                      placeholder="Choose a username"
                      value={migrateUsername}
                      onChange={(e) => setMigrateUsername(e.target.value)}
                      required
                      minLength={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="migrate-password">New Password</Label>
                    <Input
                      id="migrate-password"
                      data-testid="input-migrate-password"
                      type="password"
                      placeholder="Create a password"
                      value={migratePassword}
                      onChange={(e) => setMigratePassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="migrate-lastname">Last Name (recommended)</Label>
                    <Input
                      id="migrate-lastname"
                      data-testid="input-migrate-lastname"
                      type="text"
                      placeholder="Enter your last name for verification"
                      value={migrateLastName}
                      onChange={(e) => setMigrateLastName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Required if multiple accounts share your first name
                    </p>
                  </div>

                  <Button
                    type="submit"
                    data-testid="button-migrate"
                    className="w-full"
                    disabled={migrateMutation.isPending}
                  >
                    {migrateMutation.isPending ? "Migrating..." : "Claim Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-primary/10 items-center justify-center p-12">
        <div className="max-w-lg space-y-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Track. Compete. Achieve.
          </h2>
          <p className="text-lg text-muted-foreground">
            Join teams, track your fitness activities, and compete in monthly challenges.
            Burn calories, crush goals, and climb the leaderboard!
          </p>
          
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Log calories, steps, and workouts daily
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold">Join Teams</h3>
              <p className="text-sm text-muted-foreground">
                Compete with up to 20 teammates
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold">Win Challenges</h3>
              <p className="text-sm text-muted-foreground">
                Climb monthly leaderboards
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
