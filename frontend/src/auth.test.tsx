import { render, screen, fireEvent, waitFor, renderHook, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { api, setAccessToken } from "./api/axios";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("./api/axios", () => ({
  api: { post: vi.fn() },
  setAccessToken: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
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

beforeEach(() => {
  vi.clearAllMocks();
  // default: bootstrap refresh fails (no session)
  mockedApi.post.mockRejectedValue(new Error("no session"));
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AuthContext", () => {
  it("starts loading then resolves with null user when refresh fails", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("restores user from refresh on bootstrap", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" };
    mockedApi.post.mockResolvedValueOnce({ data: { user, accessToken: "tok" } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(user);
    expect(mockedSetToken).toHaveBeenCalledWith("tok");
  });

  it("login returns the user and updates state", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" };
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))     // bootstrap
      .mockResolvedValueOnce({ data: { user, accessToken: "tok" } }); // login

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returned: Awaited<ReturnType<typeof result.current.login>> | undefined;
    await act(async () => {
      returned = await result.current.login({ email: "j@e.com", password: "secret" });
    });

    expect(returned).toEqual(user);
    expect(result.current.user).toEqual(user);
  });

  it("logout clears user and calls /api/auth/logout", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" };
    mockedApi.post
      .mockResolvedValueOnce({ data: { user, accessToken: "tok" } }) // bootstrap
      .mockResolvedValueOnce({ data: { message: "ok" } });            // logout

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(user));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedApi.post).toHaveBeenCalledWith("/api/auth/logout");
    expect(result.current.user).toBeNull();
    expect(mockedSetToken).toHaveBeenCalledWith(null);
  });
});

describe("ProtectedRoute", () => {
  const renderAt = (initialPath: string, element: ReactNode) =>
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/login" element={<div>LOGIN</div>} />
            <Route path={initialPath} element={element} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

  it("redirects to /login when no user", () => {
    mockedApi.post.mockRejectedValue(new Error("no session"));

    renderAt("/dashboard", <ProtectedRoute><div>SECRET</div></ProtectedRoute>);

    // AuthProvider bootstraps async; wait for loading false then redirect
    return waitFor(() => expect(screen.getByText("LOGIN")).toBeInTheDocument());
  });

  it("renders children for a logged-in user", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" };
    mockedApi.post.mockResolvedValueOnce({ data: { user, accessToken: "tok" } });

    renderAt(
      "/dashboard",
      <ProtectedRoute><div>SECRET</div></ProtectedRoute>
    );

    expect(await screen.findByText("SECRET")).toBeInTheDocument();
  });
});

describe("Login page", () => {
  it("renders fields and button", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(getSubmitButton(/sign in/i)).toBeInTheDocument();
  });

  it("navigates to /profile after a successful farmer login", async () => {
    const user = { id: "u1", name: "Jane", email: "j@e.com", role: "farmer" };
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))            // bootstrap
      .mockResolvedValueOnce({ data: { user, accessToken: "t" } }); // login

    renderLogin();
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "j@e.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    fireEvent.click(getSubmitButton(/sign in/i)!);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true }));
  });

  it("navigates to /profile after a successful admin login", async () => {
    const user = { id: "u1", name: "Admin", email: "a@e.com", role: "admin" };
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))
      .mockResolvedValueOnce({ data: { user, accessToken: "t" } });

    renderLogin();
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@e.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    fireEvent.click(getSubmitButton(/sign in/i)!);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true }));
  });

  it("shows backend error message on failure", async () => {
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { message: "Invalid credentials" } },
      });

    renderLogin();
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "j@e.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(getSubmitButton(/sign in/i)!);

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});

describe("Register page", () => {
  it("renders name, email, password, and role fields", () => {
    renderRegister();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it("navigates to /profile after successful registration", async () => {
    const user = { id: "u2", name: "John", email: "john@e.com", role: "farmer" };
    mockedApi.post
      .mockRejectedValueOnce(new Error("no session"))
      .mockResolvedValueOnce({ data: { user, accessToken: "t" } });

    renderRegister();
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "john@e.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true }));
  });
});
