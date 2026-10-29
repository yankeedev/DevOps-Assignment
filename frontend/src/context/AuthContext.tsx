import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api, setAccessToken } from "../api/axios";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "farmer" | "buyer" | "admin";
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
  role?: "farmer" | "buyer";
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

const USER_STORAGE_KEY = "agrirent-user";
const TOKEN_STORAGE_KEY = "agrirent-access-token";

const persistSession = (user: User | null, accessToken: string | null) => {
  if (typeof window === "undefined") return;

  if (user && accessToken) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    return;
  }

  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const loadStoredSession = () => {
  if (typeof window === "undefined") return { user: null as User | null, accessToken: null as string | null };

  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!storedUser || !storedToken) {
    return { user: null, accessToken: null };
  }

  try {
    return {
      user: JSON.parse(storedUser) as User,
      accessToken: storedToken,
    };
  } catch {
    persistSession(null, null);
    return { user: null, accessToken: null };
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedSession = loadStoredSession();
      if (storedSession.user && storedSession.accessToken) {
        setAccessToken(storedSession.accessToken);
        setUser(storedSession.user);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.post("/api/auth/refresh");
        setAccessToken(data.accessToken);
        setUser(data.user);
        persistSession(data.user, data.accessToken);
      } catch {
        setUser(null);
        setAccessToken(null);
        persistSession(null, null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (input: LoginInput): Promise<User> => {
    const { data } = await api.post("/api/auth/login", input);
    const nextUser = data.user as User;
    const nextToken = data.accessToken as string;
    setAccessToken(nextToken);
    setUser(nextUser);
    persistSession(nextUser, nextToken);
    return nextUser;
  };

  const register = async (input: RegisterInput): Promise<User> => {
    const { data } = await api.post("/api/auth/register", input);
    const nextUser = data.user as User;
    const nextToken = data.accessToken as string;
    setAccessToken(nextToken);
    setUser(nextUser);
    persistSession(nextUser, nextToken);
    return nextUser;
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setAccessToken(null);
    setUser(null);
    persistSession(null, null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};