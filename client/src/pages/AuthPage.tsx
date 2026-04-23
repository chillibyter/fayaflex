import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Fingerprint, ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { authenticateWithPasskey } from "@/lib/passkey";
import RotatingBanner, { defaultBannerMessages } from "@/components/RotatingBanner";

// ── Password strength ────────────────────────────────────────────────────────
type StrengthLevel = "weak" | "fair" | "strong" | "very_strong";

function getPasswordStrength(pw: string): StrengthLevel | null {
  if (!pw) return null;
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  if (pw.length >= 12 && hasUpper && hasNumber && hasSpecial) return "very_strong";
  if (pw.length >= 8 && hasNumber && hasUpper) return "strong";
  if (pw.length >= 6 && (hasNumber || hasUpper)) return "fair";
  return "weak";
}

const strengthMeta: Record<StrengthLevel, { label: string; color: string; bars: number }> = {
  weak:       { label: "Weak",        color: "bg-red-500",    bars: 1 },
  fair:       { label: "Fair",        color: "bg-orange-400", bars: 2 },
  strong:     { label: "Strong",      color: "bg-primary",    bars: 3 },
  very_strong:{ label: "Very Strong", color: "bg-primary",    bars: 4 },
};

function PasswordStrengthMeter({ password }: { password: string }) {
  const level = getPasswordStrength(password);
  if (!level) return null;
  const { label, color, bars } = strengthMeta[level];
  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${n <= bars ? color : "bg-muted"}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${level === "weak" ? "text-red-500" : level === "fair" ? "text-orange-500" : "text-green-700 dark:text-green-400"}`}>
        {label}
      </p>
    </div>
  );
}

// ── Username availability indicator ─────────────────────────────────────────
type AvailStatus = "idle" | "checking" | "available" | "taken" | "too_short";

function UsernameStatus({ status }: { status: AvailStatus }) {
  if (status === "idle" || status === "too_short") return null;
  if (status === "checking") return (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <Loader2 className="w-3 h-3 animate-spin" /> Checking…
    </p>
  );
  if (status === "available") return (
    <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> Username available
    </p>
  );
  return (
    <p className="text-xs text-red-500 flex items-center gap-1">
      <XCircle className="w-3 h-3" /> Username already taken
    </p>
  );
}

export default function AuthPage() {
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
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [usernameStatus, setUsernameStatus] = useState<AvailStatus>("idle");

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotError, setForgotError] = useState("");

  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (user) setLocation("/");
  }, [user]);

  // ── Username availability debounce ─────────────────────────────────────────
  useEffect(() => {
    if (!registerUsername || registerUsername.length < 3) {
      setUsernameStatus(registerUsername.length > 0 ? "too_short" : "idle");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-username?username=${encodeURIComponent(registerUsername)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [registerUsername]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateLogin = () => {
    if (!loginUsername.trim()) { setLoginError("Please enter your username"); return false; }
    if (!loginPassword) { setLoginError("Please enter your password"); return false; }
    return true;
  };

  const validateRegister = () => {
    const errors: Record<string, string> = {};
    if (!registerUsername.trim()) errors.username = "Username is required";
    else if (registerUsername.trim().length < 3) errors.username = "Username must be at least 3 characters";
    else if (usernameStatus === "taken") errors.username = "This username is already taken";

    if (!registerPassword) errors.password = "Password is required";
    else if (registerPassword.length < 6) errors.password = "Password must be at least 6 characters";

    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address";

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
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
      const newUser = await registerMutation.mutateAsync({
        username: registerUsername.trim(),
        password: registerPassword,
        email: email.trim(),
      });
      // Profile completion is now driven server-side by missing firstName/townId
      void newUser;
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
      toast({ title: "Login successful!", description: "You've been authenticated with your passkey." });
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
      toast({ title: "Check your email", description: data.message });
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
    if (!forgotPasswordEmail.trim()) { setForgotError("Please enter your email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) { setForgotError("Please enter a valid email address"); return; }
    await forgotPasswordMutation.mutateAsync(forgotPasswordEmail.trim());
  };

  const handlePasskeyLogin = async () => {
    setLoginError("");
    if (!loginUsername.trim()) { setLoginError("Please enter your username to use passkey login"); return; }
    await passkeyLoginMutation.mutateAsync(loginUsername.trim());
  };

  const clearLoginError = () => setLoginError("");
  const clearRegisterError = (field: string) => {
    setRegisterErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const switchToSignup = () => { setIsLoginView(false); clearLoginError(); };
  const switchToLogin = () => { setIsLoginView(true); setRegisterErrors({}); };

  // ── Email real-time validation ─────────────────────────────────────────────
  const emailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailInvalid = email.length > 4 && !emailValid;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-green-50/50 dark:bg-green-950/20 pt-8 pb-12 px-4">
      <div className="w-full max-w-md mb-6">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white">
          <div className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src="/fayaflex-logo.webp" alt="FayaFlex" className="h-12 w-12 rounded-lg" />
              <h1 className="text-2xl font-bold">FayaFlex</h1>
            </div>
            <RotatingBanner messages={defaultBannerMessages} className="[&_p]:text-white/90" />
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

          {/* ── LOGIN VIEW ───────────────────────────────────────────────── */}
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
                    <Label htmlFor="login-username">Username or Email</Label>
                    <Input
                      id="login-username"
                      data-testid="input-login-username"
                      type="text"
                      placeholder="Enter your username or email"
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

                {/* ── Prominent switch to Sign Up ── */}
                <div className="pt-2 border-t border-border">
                  <p className="text-center text-sm text-muted-foreground mb-3">New to FayaFlex?</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-[10px] font-semibold text-base border-primary text-primary hover:bg-primary/5"
                    onClick={switchToSignup}
                    data-testid="button-switch-to-signup"
                  >
                    Create a Free Account
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  <Link href="/privacy" className="hover:underline" data-testid="link-privacy-login">
                    Privacy Policy
                  </Link>
                </p>
              </>
            )
          ) : (
            /* ── REGISTER VIEW ──────────────────────────────────────────── */
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

                {/* Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    data-testid="input-register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={registerUsername}
                    onChange={(e) => { setRegisterUsername(e.target.value); clearRegisterError("username"); }}
                    className={`rounded-[10px] ${
                      registerErrors.username || usernameStatus === "taken"
                        ? "border-red-500 focus-visible:ring-red-500"
                        : usernameStatus === "available"
                        ? "border-green-500 focus-visible:ring-green-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                  <UsernameStatus status={usernameStatus} />
                  {registerErrors.username && (
                    <p className="text-sm text-red-500 flex items-center gap-1" data-testid="error-username">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {registerErrors.username}
                    </p>
                  )}
                </div>

                {/* Password + strength meter */}
                <div className="space-y-1.5">
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
                  <PasswordStrengthMeter password={registerPassword} />
                  {registerErrors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1" data-testid="error-password">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {registerErrors.password}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearRegisterError("email"); }}
                    className={`rounded-[10px] ${
                      registerErrors.email || emailInvalid
                        ? "border-red-500 focus-visible:ring-red-500"
                        : emailValid
                        ? "border-green-500 focus-visible:ring-green-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                  {emailInvalid && !registerErrors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Enter a valid email address
                    </p>
                  )}
                  {emailValid && !registerErrors.email && (
                    <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Looks good
                    </p>
                  )}
                  {registerErrors.email && (
                    <div className="text-sm text-red-500 flex items-start gap-1" data-testid="error-email">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        {registerErrors.email}
                        {registerErrors.email.includes("already exists") && (
                          <button
                            type="button"
                            className="ml-1 underline font-semibold"
                            onClick={() => { switchToLogin(); }}
                          >
                            Log in instead
                          </button>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  data-testid="button-register"
                  className="w-full bg-[#00A63E] hover:bg-[#009035] text-white rounded-[10px]"
                  disabled={registerMutation.isPending || usernameStatus === "taken"}
                >
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              {/* ── Prominent switch to Sign In ── */}
              <div className="pt-2 border-t border-border">
                <p className="text-center text-sm text-muted-foreground mb-3">Already have an account?</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-[10px] font-semibold text-base border-primary text-primary hover:bg-primary/5"
                  onClick={switchToLogin}
                  data-testid="button-switch-to-login"
                >
                  Sign In
                </Button>
              </div>

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
