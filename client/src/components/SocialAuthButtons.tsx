import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
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

const isNativePlatform = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();
const isIOS = platform === "ios";
const isAndroid = platform === "android";

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
  const [googleReady, setGoogleReady] = useState(isNativePlatform);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const initializedRef = useRef(false);

  const verb = mode === "signup" ? "Sign up with" : "Continue with";

  // Apple button is only meaningful on iOS native today; on the web it
  // requires an Apple Service ID + redirect-URL setup that's not wired yet.
  // Hide on Android entirely since Apple Sign-In is iOS/web only.
  const showAppleButton = isIOS || !isNativePlatform;

  // Initialize Google Identity Services on web. On native we use the
  // Capacitor plugin instead, which we initialize lazily on first tap.
  useEffect(() => {
    if (isNativePlatform) return;
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

  async function postSocialLogin(endpoint: string, body: Record<string, unknown>) {
    const res = await apiRequest("POST", endpoint, body);
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
    return user;
  }

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
      await postSocialLogin("/api/auth/google", { idToken: response.credential });
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

  async function startGoogleSignIn() {
    if (googleBusy) return;
    setGoogleBusy(true);

    // Native path — uses @southdevs/capacitor-google-auth which surfaces
    // the native Google account picker on iOS/Android and returns an
    // ID token signed by Google for our serverClientId.
    if (isNativePlatform) {
      try {
        const mod = await import("@southdevs/capacitor-google-auth");
        const GoogleAuth = (mod as any).GoogleAuth;
        try {
          await GoogleAuth.initialize?.({
            clientId: GOOGLE_CLIENT_ID,
            scopes: ["profile", "email"],
            grantOfflineAccess: true,
          });
        } catch {
          // initialize() is a no-op on iOS where config comes from plist
        }
        const result = await GoogleAuth.signIn();
        const idToken: string | undefined =
          result?.authentication?.idToken || result?.idToken;
        if (!idToken) throw new Error("No ID token from Google.");
        await postSocialLogin("/api/auth/google", { idToken });
      } catch (err: any) {
        const msg = String(err?.message || err || "");
        if (!/cancel/i.test(msg)) {
          toast({
            title: "Google sign-in failed",
            description: msg || "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setGoogleBusy(false);
      }
      return;
    }

    // Web path — Google Identity Services prompt.
    if (!googleReady || !window.google?.accounts?.id) {
      setGoogleBusy(false);
      return;
    }
    try {
      window.google.accounts.id.prompt((notification: any) => {
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

  async function startAppleSignIn() {
    if (appleBusy) return;
    setAppleBusy(true);

    // Native iOS path — uses @capacitor-community/apple-sign-in which
    // presents Apple's system sheet and returns an identityToken.
    if (isIOS) {
      try {
        const mod = await import("@capacitor-community/apple-sign-in");
        const SignInWithApple = (mod as any).SignInWithApple;
        const result = await SignInWithApple.authorize({
          clientId: "com.fayaflex.app",
          redirectURI: "https://fayaflex.com/api/auth/apple/callback",
          scopes: "email name",
          state: "auth",
        });
        const r = result?.response ?? result;
        const identityToken: string | undefined = r?.identityToken;
        if (!identityToken) throw new Error("No identity token from Apple.");
        await postSocialLogin("/api/auth/apple", {
          identityToken,
          givenName: r?.givenName ?? null,
          familyName: r?.familyName ?? null,
        });
      } catch (err: any) {
        const msg = String(err?.message || err || "");
        if (!/cancel|1001/i.test(msg)) {
          toast({
            title: "Apple sign-in failed",
            description: msg || "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setAppleBusy(false);
      }
      return;
    }

    // Web path — requires Apple Service ID + return URL config in your
    // Apple Developer account. Until that's wired, surface a clear note.
    setAppleBusy(false);
    toast({
      title: "Sign in with Apple is coming soon",
      description: "Available in our iOS app — we're enabling it on the web shortly.",
    });
  }

  // On native, we always render the buttons. On web, hide the entire block
  // if Google isn't configured (the Apple-on-web path also requires extra
  // setup, so there's nothing functional to show).
  if (!isNativePlatform && !GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-2" data-testid="social-auth-buttons">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 rounded-[10px] border-gray-300 dark:border-gray-700"
        onClick={startGoogleSignIn}
        disabled={(!googleReady && !isNativePlatform) || googleBusy}
        data-testid="button-google-signin"
      >
        {googleBusy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <SiGoogle className="w-4 h-4" />
        )}
        {googleBusy ? "Signing in..." : `${verb} Google`}
      </Button>

      {showAppleButton && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 rounded-[10px] border-gray-300 dark:border-gray-700"
          onClick={startAppleSignIn}
          disabled={appleBusy}
          data-testid="button-apple-signin"
        >
          {appleBusy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SiApple className="w-4 h-4" />
          )}
          {appleBusy ? "Signing in..." : `${verb} Apple`}
        </Button>
      )}

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
