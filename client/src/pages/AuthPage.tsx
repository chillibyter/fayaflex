import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Fingerprint, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { authenticateWithPasskey } from "@/lib/passkey";
import RotatingBanner, { defaultBannerMessages } from "@/components/RotatingBanner";
import { CitySearch } from "@/components/CitySearch";

export default function AuthPage() {
  // Context banners — read sessionStorage once at mount time (lazy init)
  const [pendingJoinTeamName] = useState<string | null>(() => {
    try {
      const raw = sessionStorage.getItem("fayaflex_pending_join");
      if (raw) return JSON.parse(raw)?.teamName ?? null;
    } catch {}
    return null;
  });

  const [draftTeamName] = useState<string | null>(() => {
    try {
      const raw = sessionStorage.getItem("fayaflex_draft_team");
      if (raw) return JSON.parse(raw)?.teamName ?? null;
    } catch {}
    return null;
  });

  // Default to register mode if a team draft is pending
  const [isLoginView, setIsLoginView] = useState(() => {
    try {
      const raw = sessionStorage.getItem("fayaflex_draft_team");
      if (raw && JSON.parse(raw)?.teamName) return false;
    } catch {}
    return true;
  });

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // Register state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  
  // Location state for registration
  const [continentId, setContinentId] = useState<string | null>(null);
  const [countryId, setCountryId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [townId, setTownId] = useState<string | null>(null);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in (useEffect to avoid calling during render)
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user]);

  const validateLogin = () => {
    if (!loginUsername.trim()) {
      setLoginError("Please enter your username");
      return false;
    }
    if (loginUsername.trim().length < 3) {
      setLoginError("Username must be at least 3 characters");
      return false;
    }
    if (!loginPassword) {
      setLoginError("Please enter your password");
      return false;
    }
    if (loginPassword.length < 6) {
      setLoginError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const validateRegister = () => {
    const errors: Record<string, string> = {};
    
    if (!registerUsername.trim()) {
      errors.username = "Username is required";
    } else if (registerUsername.trim().length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    
    if (!registerPassword) {
      errors.password = "Password is required";
    } else if (registerPassword.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (!validateLogin()) return;
    
    try {
      await loginMutation.mutateAsync({ username: loginUsername.trim(), password: loginPassword });
    } catch (error: any) {
      const message = error.message || "Login failed";
      if (message.includes("Invalid") || message.includes("credentials") || message.includes("password")) {
        setLoginError("Incorrect username or password. Please try again.");
      } else if (message.includes("not found") || message.includes("User")) {
        setLoginError("No account found with this username.");
      } else {
        setLoginError(message);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrors({});
    
    if (!validateRegister()) return;
    
    try {
      await registerMutation.mutateAsync({
        username: registerUsername.trim(),
        password: registerPassword,
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        continentId: continentId || undefined,
        countryId: countryId || undefined,
        regionId: regionId || undefined,
        townId: townId || undefined,
      });
    } catch (error: any) {
      const message = error.message || "Registration failed";
      if (message.includes("username") && (message.includes("exists") || message.includes("taken"))) {
        setRegisterErrors({ username: "This username is already taken. Please choose another." });
      } else if (message.includes("email") && (message.includes("exists") || message.includes("taken"))) {
        setRegisterErrors({ email: "An account with this email already exists." });
      } else {
        setRegisterErrors({ general: message });
      }
    }
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
      setLoginError(error.message || "Could not authenticate with passkey. Please try password login.");
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
      setForgotError("");
    },
    onError: (error: any) => {
      setForgotError(error.message || "Something went wrong. Please try again.");
    },
  });

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    
    if (!forgotPasswordEmail.trim()) {
      setForgotError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setForgotError("Please enter a valid email address");
      return;
    }
    
    await forgotPasswordMutation.mutateAsync(forgotPasswordEmail.trim());
  };

  const handlePasskeyLogin = async () => {
    setLoginError("");
    if (!loginUsername.trim()) {
      setLoginError("Please enter your username to use passkey login");
      return;
    }
    await passkeyLoginMutation.mutateAsync(loginUsername.trim());
  };

  const clearLoginError = () => setLoginError("");
  const clearRegisterError = (field: string) => {
    setRegisterErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-green-50/50 dark:bg-green-950/20 pt-8 pb-12 px-4">
      <div className="w-full max-w-md mb-6">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img 
                src="/fayaflex-logo.webp" 
                alt="FayaFlex" 
                className="h-12 w-12 rounded-lg"
              />
              <h1 className="text-2xl font-bold">FayaFlex</h1>
            </div>
            <RotatingBanner 
              messages={defaultBannerMessages} 
              className="[&_p]:text-white/90"
            />
          </div>
        </Card>
      </div>

      <Card className="w-full max-w-md shadow-lg border border-gray-100 dark:border-gray-800">
        <CardHeader className="text-center pb-2">
          <h2 className="text-xl font-semibold text-foreground" data-testid="text-auth-title">
            {showForgotPassword ? "Reset Password" : (isLoginView ? "Welcome Back" : "Create Account")}
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {(pendingJoinTeamName || draftTeamName) && (
            <div className="rounded-md bg-primary/10 border border-primary/20 px-3 py-2.5 text-sm text-center">
              {draftTeamName ? (
                <span>
                  <span className="font-semibold">Create an account</span> to launch your team{" "}
                  <span className="font-semibold">"{draftTeamName}"</span> — it'll be set up instantly.
                </span>
              ) : (
                <span>
                  Sign in or create an account and you'll be <span className="font-semibold">added to {pendingJoinTeamName}</span> automatically.
                </span>
              )}
            </div>
          )}
          {isLoginView ? (
            showForgotPassword ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1 p-0 h-auto text-muted-foreground"
                  onClick={() => { setShowForgotPassword(false); setForgotError(""); }}
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
                      onChange={(e) => { setForgotPasswordEmail(e.target.value); setForgotError(""); }}
                      className={`rounded-[10px] ${forgotError ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300 dark:border-gray-700"}`}
                    />
                    {forgotError && (
                      <p className="text-sm text-red-500 flex items-center gap-1" data-testid="error-forgot">
                        <AlertCircle className="w-4 h-4" />
                        {forgotError}
                      </p>
                    )}
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
                  {loginError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800" data-testid="error-login-banner">
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {loginError}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      data-testid="input-login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginUsername}
                      onChange={(e) => { setLoginUsername(e.target.value); clearLoginError(); }}
                      className={`rounded-[10px] ${loginError ? "border-red-300 dark:border-red-700" : "border-gray-300 dark:border-gray-700"}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        data-testid="input-login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); clearLoginError(); }}
                        className={`rounded-[10px] pr-10 ${loginError ? "border-red-300 dark:border-red-700" : "border-gray-300 dark:border-gray-700"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-toggle-login-password"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-[#00A63E] hover:text-[#009035] hover:underline"
                      onClick={() => { setShowForgotPassword(true); clearLoginError(); }}
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
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
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
                    onClick={() => { setIsLoginView(false); clearLoginError(); }}
                    data-testid="button-switch-to-signup"
                  >
                    Sign up
                  </button>
                </p>

                <p className="text-center text-xs text-muted-foreground">
                  <Link href="/privacy" className="hover:underline" data-testid="link-privacy-login">
                    Privacy Policy
                  </Link>
                </p>
              </>
            )
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-4">
                {registerErrors.general && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800" data-testid="error-register-banner">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {registerErrors.general}
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    data-testid="input-register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={registerUsername}
                    onChange={(e) => { setRegisterUsername(e.target.value); clearRegisterError("username"); }}
                    className={`rounded-[10px] ${registerErrors.username ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300 dark:border-gray-700"}`}
                  />
                  {registerErrors.username && (
                    <p className="text-sm text-red-500 flex items-center gap-1" data-testid="error-username">
                      <AlertCircle className="w-4 h-4" />
                      {registerErrors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      data-testid="input-register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="Create a password (min. 6 characters)"
                      value={registerPassword}
                      onChange={(e) => { setRegisterPassword(e.target.value); clearRegisterError("password"); }}
                      className={`rounded-[10px] pr-10 ${registerErrors.password ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300 dark:border-gray-700"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-toggle-register-password"
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerErrors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1" data-testid="error-password">
                      <AlertCircle className="w-4 h-4" />
                      {registerErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearRegisterError("email"); }}
                    className={`rounded-[10px] ${registerErrors.email ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300 dark:border-gray-700"}`}
                  />
                  {registerErrors.email && (
                    <div className="text-sm text-red-500 flex items-start gap-1" data-testid="error-email">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        {registerErrors.email}
                        {registerErrors.email.includes("already exists") && (
                          <button
                            type="button"
                            className="ml-1 underline font-semibold"
                            onClick={() => { setIsLoginView(true); setRegisterErrors({}); }}
                          >
                            Log in instead
                          </button>
                        )}
                      </span>
                    </div>
                  )}
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

                <div className="space-y-2">
                  <CitySearch
                    onSelect={(location) => {
                      setContinentId(location.continentId);
                      setCountryId(location.countryId);
                      setRegionId(location.regionId);
                      setTownId(location.townId);
                      clearRegisterError("city");
                    }}
                  />
                  {registerErrors.city && (
                    <p className="text-sm text-red-500 flex items-center gap-1" data-testid="error-city">
                      <AlertCircle className="w-4 h-4" />
                      {registerErrors.city}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  data-testid="button-register"
                  className="w-full bg-[#00A63E] hover:bg-[#009035] text-white rounded-[10px]"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-[#00A63E] hover:text-[#009035] hover:underline font-medium"
                  onClick={() => { setIsLoginView(true); setRegisterErrors({}); }}
                  data-testid="button-switch-to-login"
                >
                  Sign in
                </button>
              </p>

              <p className="text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link href="/privacy" className="hover:underline text-primary" data-testid="link-privacy-register">
                  Privacy Policy
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
