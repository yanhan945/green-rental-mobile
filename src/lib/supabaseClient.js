const SUPABASE_URL = "https://kvdxgyymlfnnurdigtkj.supabase.co";
const SUPABASE_KEY = "sb_publishable_FFoHUmn4RwaOkvx2XK7QHg__O7iWYdJ";
const AUTH_STORAGE_KEY = "green-rental-auth-session-v1";

let clientPromise;
const authListeners = new Set();

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session) {
  try {
    if (session) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // localStorage may be unavailable in private contexts; Auth can still continue for the current request.
  }
}

function notifyAuth(event, session) {
  authListeners.forEach((listener) => listener(event, session));
}

async function authRequest(path, body) {
  const response = await fetch(SUPABASE_URL + path, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { data: null, error: { message: data?.msg || data?.message || "Supabase Auth 请求失败" } };
  }

  return { data, error: null };
}

function createRestAuthClient() {
  return {
    auth: {
      async signUp({ email, password }) {
        const result = await authRequest("/auth/v1/signup", { email, password });
        if (!result.error && result.data?.access_token) {
          const session = {
            access_token: result.data.access_token,
            refresh_token: result.data.refresh_token,
            expires_in: result.data.expires_in,
            token_type: result.data.token_type,
            user: result.data.user,
          };
          writeStoredSession(session);
          notifyAuth("SIGNED_IN", session);
          return { data: { session, user: result.data.user }, error: null };
        }
        return { data: { session: null, user: result.data?.user || null }, error: result.error };
      },
      async signInWithPassword({ email, password }) {
        const result = await authRequest("/auth/v1/token?grant_type=password", { email, password });
        if (result.error) return result;

        const session = {
          access_token: result.data.access_token,
          refresh_token: result.data.refresh_token,
          expires_in: result.data.expires_in,
          token_type: result.data.token_type,
          user: result.data.user,
        };
        writeStoredSession(session);
        notifyAuth("SIGNED_IN", session);
        return { data: { session, user: result.data.user }, error: null };
      },
      async signOut() {
        writeStoredSession(null);
        notifyAuth("SIGNED_OUT", null);
        return { error: null };
      },
      async getSession() {
        return { data: { session: readStoredSession() }, error: null };
      },
      onAuthStateChange(callback) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
    },
  };
}

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const packageName = "@supabase/supabase-js";
        const { createClient } = await import(/* @vite-ignore */ packageName);
        return createClient(SUPABASE_URL, SUPABASE_KEY);
      } catch {
        return createRestAuthClient();
      }
    })();
  }
  return clientPromise;
}

export const supabase = {
  auth: {
    async signUp(args) {
      return (await getClient()).auth.signUp(args);
    },
    async signInWithPassword(args) {
      return (await getClient()).auth.signInWithPassword(args);
    },
    async signOut() {
      return (await getClient()).auth.signOut();
    },
    async getSession() {
      return (await getClient()).auth.getSession();
    },
    onAuthStateChange(callback) {
      const localSubscription = createRestAuthClient().auth.onAuthStateChange(callback);
      getClient().then((client) => {
        if (client.auth.onAuthStateChange !== supabase.auth.onAuthStateChange) {
          const result = client.auth.onAuthStateChange(callback);
          localSubscription.data.subscription.unsubscribe = () => {
            authListeners.delete(callback);
            result.data.subscription.unsubscribe();
          };
        }
      });
      return localSubscription;
    },
  },
};
