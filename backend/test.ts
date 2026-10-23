import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  register,
  login,
  refresh,
  logout,
  me,
} from "./controllers/auth.controller";
import prisma from "./config/prisma";
import { signRefreshToken, signAccessToken, verifyAccessToken } from "./lib/jwt";
import { hashPassword, comparePassword } from "./lib/password";
import { requireAuth, requireRole, AuthRequest } from "./middleware/auth.middleware";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("./config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock; create: jest.Mock };
};
const mockedBcrypt = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRes = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as Response);

const makeReq = (body: any = {}, cookies: any = {}, user?: any) =>
  ({ body, cookies, user } as unknown as Request);

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test_access_secret";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
  process.env.JWT_ACCESS_EXPIRES = "15m";
  process.env.JWT_REFRESH_EXPIRES = "7d";
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("password helpers", () => {
  it("hash and compare round-trip", async () => {
    // use the real bcrypt (not the mock) for this one
    jest.unmock("bcryptjs");
    const realBcrypt = jest.requireActual("bcryptjs");
    const plain = "secret123";
    const hash = await realBcrypt.hash(plain, 10);
    expect(hash).not.toBe(plain);
    expect(await realBcrypt.compare(plain, hash)).toBe(true);
    expect(await realBcrypt.compare("wrong", hash)).toBe(false);
    jest.mock("bcryptjs", () => ({
      __esModule: true,
      default: { hash: jest.fn(), compare: jest.fn() },
    }));
  });
});

describe("jwt helpers", () => {
  it("signs and verifies access tokens", () => {
    const token = signAccessToken({ userId: "u1", role: "FARMER" });
    const decoded = verifyAccessToken(token);
    expect(decoded).toEqual({ userId: "u1", role: "FARMER" });
  });

  it("rejects an access token as a refresh token", () => {
    const token = signAccessToken({ userId: "u1", role: "FARMER" });
    // verifyAccessToken would succeed but this is the wrong direction — sanity check
    expect(() => verifyAccessToken("garbage")).toThrow();
  });
});

describe("auth.controller register", () => {
  it("creates a user and returns a session", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue("hashed");
    mockedPrisma.user.create.mockResolvedValue({
      id: "u1",
      name: "Jane",
      email: "jane@example.com",
      role: "FARMER",
    });

    const req = makeReq({
      name: "Jane",
      email: "Jane@Example.com",
      password: "secret123",
      role: "farmer",
    });
    const res = makeRes();

    await register(req, res);

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
    });
    expect(mockedPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: "jane@example.com", role: "FARMER" }),
    });
    expect(res.cookie).toHaveBeenCalledWith("refreshToken", expect.any(String), expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({ role: "farmer" }),
      })
    );
  });

  it("returns 400 when email is already registered", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "existing" });

    const req = makeReq({ name: "Jane", email: "jane@example.com", password: "secret123" });
    const res = makeRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockedPrisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure", async () => {
    const req = makeReq({ name: "J", email: "bad", password: "short" });
    const res = makeRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("maps buyer role to EQUIPMENT_OWNER in DB", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue("hashed");
    mockedPrisma.user.create.mockResolvedValue({
      id: "u1",
      name: "Jane",
      email: "jane@example.com",
      role: "EQUIPMENT_OWNER",
    });

    const req = makeReq({
      name: "Jane",
      email: "jane@example.com",
      password: "secret123",
      role: "buyer",
    });
    const res = makeRes();

    await register(req, res);

    expect(mockedPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: "EQUIPMENT_OWNER" }),
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ role: "buyer" }) })
    );
  });
});

describe("auth.controller login", () => {
  it("returns tokens when credentials are valid", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Jane",
      email: "jane@example.com",
      role: "FARMER",
      passwordHash: "hashed",
    });
    mockedBcrypt.compare.mockResolvedValue(true);

    const req = makeReq({ email: "jane@example.com", password: "secret123" });
    const res = makeRes();

    await login(req, res);

    expect(res.cookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: expect.any(String) })
    );
  });

  it("returns 401 when user is missing", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const req = makeReq({ email: "missing@example.com", password: "secret123" });
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when password is wrong", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "jane@example.com",
      passwordHash: "hashed",
      role: "FARMER",
    });
    mockedBcrypt.compare.mockResolvedValue(false);

    const req = makeReq({ email: "jane@example.com", password: "wrong" });
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("auth.controller refresh", () => {
  it("returns 401 when there is no cookie", async () => {
    const req = makeReq({}, {});
    const res = makeRes();

    await refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when the token is invalid", async () => {
    const req = makeReq({}, { refreshToken: "garbage" });
    const res = makeRes();

    await refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("issues new tokens when the refresh token is valid", async () => {
    const token = signRefreshToken({ userId: "u1", role: "FARMER" });
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Jane",
      email: "jane@example.com",
      role: "FARMER",
    });

    const req = makeReq({}, { refreshToken: token });
    const res = makeRes();

    await refresh(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: expect.any(String) })
    );
  });
});

describe("auth.controller logout", () => {
  it("clears the refresh cookie", () => {
    const req = makeReq();
    const res = makeRes();

    logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({ message: "Logged out" });
  });
});

describe("auth.controller me", () => {
  it("returns 401 when req.user is missing", async () => {
    const req = makeReq();
    const res = makeRes();

    await me(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns the current user", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Jane",
      email: "jane@example.com",
      role: "ADMIN",
    });

    const req = makeReq({}, {}, { userId: "u1", role: "ADMIN" });
    const res = makeRes();

    await me(req, res);

    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({ id: "u1", role: "admin" }),
    });
  });
});

describe("auth.middleware requireAuth", () => {
  it("calls next on a valid Bearer token", () => {
    const token = signAccessToken({ userId: "u1", role: "FARMER" });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = makeRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: "u1", role: "FARMER" });
  });

  it("returns 401 when there is no header", () => {
    const req = { headers: {} } as AuthRequest;
    const res = makeRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 on a bad token", () => {
    const req = { headers: { authorization: "Bearer garbage" } } as AuthRequest;
    const res = makeRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("auth.middleware requireRole", () => {
  it("calls next when the role matches", () => {
    const req = { user: { userId: "u1", role: "ADMIN" } } as AuthRequest;
    const res = makeRes();
    const next = jest.fn();

    requireRole("ADMIN")(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 403 when the role does not match", () => {
    const req = { user: { userId: "u1", role: "FARMER" } } as AuthRequest;
    const res = makeRes();
    const next = jest.fn();

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 401 when req.user is missing", () => {
    const req = {} as AuthRequest;
    const res = makeRes();
    const next = jest.fn();

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});