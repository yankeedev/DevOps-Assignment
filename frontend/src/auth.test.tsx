import { render, screen, fireEvent, waitFor, renderHook, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ReactNode } from "react";
import { vi } from "vitest";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { api, setAccessToken } from "./api/axios";

vi.mock("./api/axios", () => ({
  api: { post: vi.fn() },
  setAccessToken: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockedApi = api as unknown as { post: ReturnType<typeof vi.fn> };
const mockedSetToken = setAccessToken as unknown as ReturnType<typeof vi.fn>;

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const renderLogin = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthProvider>
  );

const renderRegister = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </AuthProvider>
  );

const getSubmitButton = (name: RegExp) =>
  screen
    .getAllByRole("button", { name })
    .find((button) => button.getAttribute("type") === "submit");

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockedApi.post.mockRejectedValue(new Error("no session"));
  });

  it("starts loading then resolves with null user when refresh fails", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("restores user from refresh on bootstrap", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" as const };
    mockedApi.post.mockResolvedValueOnce({ data: { user, accessToken: "tok" } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(user);
    expect(mockedSetToken).toHaveBeenCalledWith("tok");
  });

  it("login returns the user and updates state", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" as const };
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))
      .mockResolvedValueOnce({ data: { user, accessToken: "tok" } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let returned: Awaited<ReturnType<typeof result.current.login>> | undefined;
    await act(async () => {
      returned = await result.current.login({ email: "j@e.com", password: "secret" });
    });
    expect(returned).toEqual(user);
    expect(result.current.user).toEqual(user);
    expect(localStorage.getItem("agrirent-user")).toBe(JSON.stringify(user));
    expect(localStorage.getItem("agrirent-access-token")).toBe("tok");
  });

  it("logout clears user and calls /auth/logout", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" as const };
    mockedApi.post
      .mockResolvedValueOnce({ data: { user, accessToken: "tok" } })
      .mockResolvedValueOnce({ data: { message: "ok" } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(user));
    await act(async () => { await result.current.logout(); });
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/logout");
    expect(result.current.user).toBeNull();
    expect(mockedSetToken).toHaveBeenCalledWith(null);
  });
});

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockedApi.post.mockRejectedValue(new Error("no session"));
  });

  const renderAt = (initialPath: string, element: ReactNode) =>
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/" element={<div>HOME</div>} />
            <Route path={initialPath} element={element} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

  it("redirects to / when no user", async () => {
    renderAt("/dashboard", <ProtectedRoute><div>SECRET</div></ProtectedRoute>);
    await waitFor(() => expect(screen.getByText("HOME")).toBeTruthy());
  });

  it("renders children for a logged-in user", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" as const };
    mockedApi.post.mockResolvedValueOnce({ data: { user, accessToken: "tok" } });
    renderAt("/dashboard", <ProtectedRoute><div>SECRET</div></ProtectedRoute>);
    expect(await screen.findByText("SECRET")).toBeTruthy();
  });
});

describe("Login page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockedApi.post.mockRejectedValue(new Error("no session"));
  });

  it("renders fields and button", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(getSubmitButton(/sign in/i)).toBeTruthy();
  });

  it("navigates to /dashboard after a successful farmer login", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" as const };
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))
      .mockResolvedValueOnce({ data: { user, accessToken: "t" } });
    renderLogin();
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "j@e.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    fireEvent.click(getSubmitButton(/sign in/i)!);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
  });

  it("navigates to /admin after a successful admin login", async () => {
    const user = { id: "u1", name: "Admin", email: "a@e.com", role: "admin" as const };
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))
      .mockResolvedValueOnce({ data: { user, accessToken: "t" } });
    renderLogin();
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@e.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    fireEvent.click(getSubmitButton(/sign in/i)!);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true }));
  });

  it("shows error message on failed login", async () => {
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))
      .mockRejectedValueOnce(Object.assign(new Error("Invalid credentials"), {
        response: { data: { message: "Invalid credentials" } },
      }));
    renderLogin();
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "j@e.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(getSubmitButton(/sign in/i)!);
    expect(await screen.findByText("Invalid credentials")).toBeTruthy();
  });
});

describe("Register page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockedApi.post.mockRejectedValue(new Error("no session"));
  });

  it("renders name, email, password, and role fields", () => {
    renderRegister();
    expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByLabelText(/role/i)).toBeTruthy();
  });

  it("navigates to /dashboard after successful registration", async () => {
    const user = { id: "u2", name: "John", email: "john@e.com", role: "farmer" as const };
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))
      .mockResolvedValueOnce({ data: { user, accessToken: "t" } });
    renderRegister();
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "john@e.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
  });
});
