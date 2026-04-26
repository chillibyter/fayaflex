import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { setAuthToken } from "@/lib/authStorage";
import { useLocation } from "wouter";
import { SiGoogle, SiApple } from "react-icons/si";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GSI_SRC = "https://accounts.google.com/gsi/client";

let gsiLoadingPromise: Promise<void> | null = null;
function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiLoadingPromise) return gsiLoadingPromise;
  gsiLoadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in")));
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(s);
  });
  return gsiLoadingPromise;
}

type Props = {
  /** Optional copy override, e.g. "Sign up with" vs "Continue with". */
  mode?: "login" | "signup";
};

export default function SocialAuthButtons({ mode = "login" }: Props) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [googleReady, setGoogleReady] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const initializedRef = useRef(false);

  const verb = mode === "signup" ? "Sign up with" : "Continue with";

  // Initialize Google Identity Services once. The official google.accounts.id
  // flow returns a JWT ID token in the credential callback, which we send to
  // our /api/auth/google endpoint for server-side verification.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled) return;
        if (!window.google?.accounts?.id) return;
        if (initializedRef.current) {
          setGoogleReady(true);
          return;
        }
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          ux_mode: "popup",
          auto_select: false,
        });
        initializedRef.current = true;
        setGoogleReady(true);
      })
      .catch(() => {
        // Network blocked / GSI unavailable — leave button disabled silently.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleCredential(response: { credential?: string }) {
    if (!response?.credential) {
      setGoogleBusy(false);
      toast({
        title: "Google sign-in cancelled",
        description: "No credential received from Google.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await apiRequest("POST", "/api/auth/google", {
        idToken: response.credential,
      });
      const user = await res.json();
      if (user?.token) {
        await setAuthToken(user.token);
      }
      queryClient.setQueryData(["/api/auth/user"], user);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Signed in",
        description: `Welcome${user?.firstName ? `, ${user.firstName}` : ""}!`,
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Google sign-in failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGoogleBusy(false);
    }
  }

  function startGoogleSignIn() {
    if (!googleReady || !window.google?.accounts?.id) return;
    setGoogleBusy(true);
    // Open the Google account chooser popup. The credential is delivered
    // asynchronously via the callback registered in initialize().
    try {
      window.google.accounts.id.prompt((notification: any) => {
        // If the One Tap prompt isn't displayed (e.g. user dismissed before,
        // or third-party cookies blocked), fall back to a full popup using
        // OAuth2's tokenClient flow. We still ask for openid+email+profile so
        // we can call userinfo with the access token if needed — but the
        // primary path is the ID token from prompt().
        if (
          notification?.isNotDisplayed?.() ||
          notification?.isSkippedMoment?.() ||
          notification?.isDismissedMoment?.()
        ) {
          setGoogleBusy(false);
        }
      });
    } catch {
      setGoogleBusy(false);
    }
  }

  function handleAppleClick() {
    // Apple Sign-In requires either:
    //   1. A configured Apple Service ID + return URL for web (not yet set up), OR
    //   2. The native Capacitor Apple Sign-In plugin running in our iOS app.
    // Until either path is wired, surface a clear message instead of silently
    // failing.
    toast({
      title: "Sign in with Apple is coming soon",
      description: "Available in our iOS app — we're enabling it on the web shortly.",
    });
  }

  // If Google client ID isn't configured at build time, hide the whole block —
  // the buttons would be non-functional anyway.
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-2" data-testid="social-auth-buttons">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 rounded-[10px] border-gray-300 dark:border-gray-700"
        onClick={startGoogleSignIn}
        disabled={!googleReady || googleBusy}
        data-testid="button-google-signin"
      >
        {googleBusy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <SiGoogle className="w-4 h-4" />
        )}
        {googleBusy ? "Signing in..." : `${verb} Google`}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 rounded-[10px] border-gray-300 dark:border-gray-700"
        onClick={handleAppleClick}
        data-testid="button-apple-signin"
      >
        <SiApple className="w-4 h-4" />
        {verb} Apple
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2 text-xs text-muted-foreground">or</span>
        </div>
      </div>
    </div>
  );
}
