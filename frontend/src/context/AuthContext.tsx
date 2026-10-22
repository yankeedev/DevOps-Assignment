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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post("/api/auth/refresh");
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (input: LoginInput): Promise<User> => {
    const { data } = await api.post("/api/auth/login", input);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user as User;
  };

  const register = async (input: RegisterInput): Promise<User> => {
    const { data } = await api.post("/api/auth/register", input);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user as User;
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setAccessToken(null);
    setUser(null);
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