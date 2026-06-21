import { useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "./auth-context";
export { useAuth } from "./auth-context";

const OAUTH_IN_PROGRESS_STORAGE_KEY = "lovable:google-oauth-in-progress";
const OAUTH_IN_PROGRESS_MAX_AGE_MS = 2 * 60 * 1000;
const OAUTH_REDIRECT_TO_KEY = "lovable:google-oauth-redirect-to";
const OAUTH_SIGNUP_OPTIN_KEY = "lovable:google-oauth-signup-optin";

const getLocationSnapshot = () => {
  if (typeof window === "undefined") {
    return { href: "", pathname: "", search: "", hash: "" };
  }

  return {
    href: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
};

const hasOAuthCallbackParams = (search: string, hash: string) =>
  hash.includes("access_token=") ||
  hash.includes("provider_token=") ||
  /[?&]code=/.test(search);

const consumeOAuthRedirectTo = () => {
  if (typeof window === "undefined") return "/dashboard";

  const redirectTo = window.sessionStorage.getItem(OAUTH_REDIRECT_TO_KEY) || "/dashboard";
  window.sessionStorage.removeItem(OAUTH_REDIRECT_TO_KEY);
  return redirectTo.startsWith("/") ? redirectTo : "/dashboard";
};

const consumeOAuthSignupOptIn = () => {
  if (typeof window === "undefined") return null;

  const pendingOptIn = window.sessionStorage.getItem(OAUTH_SIGNUP_OPTIN_KEY);
  if (pendingOptIn !== null) {
    window.sessionStorage.removeItem(OAUTH_SIGNUP_OPTIN_KEY);
  }
  return pendingOptIn;
};

const hasPendingOAuthSignIn = () => {
  if (typeof window === "undefined") return false;

  const raw = window.sessionStorage.getItem(OAUTH_IN_PROGRESS_STORAGE_KEY);
  if (!raw) return false;

  const startedAt = Number(raw);
  if (!Number.isFinite(startedAt)) {
    window.sessionStorage.removeItem(OAUTH_IN_PROGRESS_STORAGE_KEY);
    return false;
  }

  const isFresh = Date.now() - startedAt < OAUTH_IN_PROGRESS_MAX_AGE_MS;
  if (!isFresh) {
    window.sessionStorage.removeItem(OAUTH_IN_PROGRESS_STORAGE_KEY);
  }

  return isFresh;
};

const clearPendingOAuthSignIn = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(OAUTH_IN_PROGRESS_STORAGE_KEY);
};

const logAuthError = (label: string, error: unknown, extra: Record<string, unknown> = {}) => {
  const normalizedError = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    : error;

  console.error(label, {
    ...extra,
    error: normalizedError,
    ...getLocationSnapshot(),
  });
};




export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initialLocation = getLocationSnapshot();
    const isOAuthCallback = hasOAuthCallbackParams(initialLocation.search, initialLocation.hash);
    const pendingOAuthSignIn = hasPendingOAuthSignIn();
    let oauthCallbackRedirectStarted = false;

    console.log("[AuthProvider] mount", {
      ...initialLocation,
      isOAuthCallback,
      pendingOAuthSignIn,
    });

    let initialResolved = false;
    const resolveInitial = (reason: string) => {
      if (initialResolved) return;
      initialResolved = true;
      clearPendingOAuthSignIn();
      console.log("[AuthProvider] resolveInitial", {
        reason,
        ...getLocationSnapshot(),
      });
      setLoading(false);
    };

    const applySession = (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        clearPendingOAuthSignIn();
        if (isOAuthCallback && typeof window !== "undefined" && window.location.pathname !== "/auth" && !oauthCallbackRedirectStarted) {
          oauthCallbackRedirectStarted = true;
          const redirectTo = consumeOAuthRedirectTo();
          const pendingOptIn = consumeOAuthSignupOptIn();

          void (async () => {
            if (pendingOptIn !== null) {
              const optIn = pendingOptIn === "true";
              try {
                await supabase
                  .from("profiles")
                  .update({ opt_in_marketing: optIn })
                  .eq("user_id", nextSession.user.id);
              } catch (error) {
                logAuthError("[AuthProvider] profile opt-in update failed", error, {
                  userId: nextSession.user.id,
                });
              }

              try {
                await supabase.functions.invoke("brevo-sync-signup");
              } catch (error) {
                logAuthError("[AuthProvider] brevo signup sync failed", error, {
                  userId: nextSession.user.id,
                });
              }
            }

            window.location.replace(redirectTo);
          })();
        }
        setTimeout(async () => {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", nextSession.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (error) {
            logAuthError("[AuthProvider] admin role lookup failed", error, {
              userId: nextSession.user.id,
            });
          }

          setIsAdmin(!!data);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    };

    const validateSession = async (reason: string, nextSession: Session | null) => {
      if (!nextSession?.user) return;

      const { error } = await supabase.auth.getUser();
      if (error) {
        logAuthError("[AuthProvider] getUser validation failed", error, {
          reason,
          userId: nextSession.user.id,
        });
      }
    };

    const forceSessionRefresh = async (reason: string) => {
      const location = getLocationSnapshot();
      const callbackActive = hasOAuthCallbackParams(location.search, location.hash);
      const pending = hasPendingOAuthSignIn();

      if (!callbackActive && !pending) {
        return false;
      }

      console.log("[AuthProvider] forceSessionRefresh", {
        reason,
        callbackActive,
        pending,
        ...location,
      });

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          logAuthError("[AuthProvider] forced getSession failed", error, {
            reason,
            callbackActive,
            pending,
          });
        }

        applySession(data.session);

        if (data.session) {
          void validateSession(`forced-refresh:${reason}`, data.session);
          resolveInitial(`forced-refresh:${reason}`);
          return true;
        }

        console.error("[AuthProvider] forced getSession returned no session", {
          reason,
          callbackActive,
          pending,
          ...getLocationSnapshot(),
        });
      } catch (error) {
        logAuthError("[AuthProvider] forceSessionRefresh crashed", error, {
          reason,
          callbackActive,
          pending,
        });
      }

      return false;
    };

    if (isOAuthCallback || pendingOAuthSignIn) {
      void forceSessionRefresh("mount-immediate");

      setTimeout(() => {
        void forceSessionRefresh("mount-retry-300ms");
      }, 300);

      setTimeout(() => {
        void forceSessionRefresh("mount-retry-1200ms");
      }, 1200);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      const location = getLocationSnapshot();
      const oauthCallbackActive = hasOAuthCallbackParams(location.search, location.hash);
      const pendingOAuthSignIn = hasPendingOAuthSignIn();
      const shouldKeepLoadingForOAuth =
        event === "INITIAL_SESSION" &&
        !newSession &&
        (oauthCallbackActive || pendingOAuthSignIn);

      console.log("[AuthProvider] onAuthStateChange", {
        event,
        hasSession: !!newSession,
        userId: newSession?.user?.id ?? null,
        oauthCallbackActive,
        pendingOAuthSignIn,
        shouldKeepLoadingForOAuth,
        ...location,
      });

      applySession(newSession);

      if (newSession) {
        void validateSession(`auth-event:${event}`, newSession);
      }

      if (shouldKeepLoadingForOAuth) {
        void forceSessionRefresh(`auth-event:${event}`);
        return;
      }

      resolveInitial(`auth-event:${event}`);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log("[AuthProvider] getSession resolved", {
          hasSession: !!session,
          userId: session?.user?.id ?? null,
          isOAuthCallback,
          pendingOAuthSignIn: hasPendingOAuthSignIn(),
          ...getLocationSnapshot(),
        });

        applySession(session);

        if (session) {
          void validateSession("getSession", session);
        }

        if (session || (!isOAuthCallback && !pendingOAuthSignIn)) {
          resolveInitial(session ? "existing-session" : "no-oauth-callback-detected");
        }
      })
      .catch((error) => {
        logAuthError("[AuthProvider] getSession failed", error);
        resolveInitial("getSession-error");
      });

    // Safety net: never stay in the loading state forever.
    const timeout = setTimeout(() => {
      console.log("[AuthProvider] initialization timeout", {
        isOAuthCallback,
        pendingOAuthSignIn: hasPendingOAuthSignIn(),
        ...getLocationSnapshot(),
      });
      resolveInitial("timeout");
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);


  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
