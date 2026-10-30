import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import prisma from "../config/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
const ACCESS_EXPIRES = (process.env.JWT_ACCESS_EXPIRES || "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRES = (process.env.JWT_REFRESH_EXPIRES || "7d") as SignOptions["expiresIn"];
const IS_PROD = process.env.NODE_ENV === "production";

const useSecureCookies = IS_PROD && !!process.env.CLIENT_URL?.startsWith("https://");

const cookieOptions = {
  httpOnly: true,
  secure: useSecureCookies,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["farmer", "buyer"]).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

const toDbRole = (role?: "farmer" | "buyer"): "FARMER" | "EQUIPMENT_OWNER" => {
  if (role === "buyer") return "EQUIPMENT_OWNER";
  return "FARMER";
};

const toFrontendRole = (role: string): "farmer" | "buyer" | "admin" => {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "EQUIPMENT_OWNER":
    case "SHOP_OWNER":
      return "buyer";
    case "FARMER":
    default:
      return "farmer";
  }
};

const sanitizeUser = (user: { id: string; name: string; email: string; role: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: toFrontendRole(user.role),
});

const issueTokens = (user: { id: string; role: string }) => {
  const payload = { userId: user.id, role: user.role };
  return {
    accessToken: jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES }),
    refreshToken: jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES }),
  };
};

const sendSession = (
  res: Response,
  user: { id: string; name: string; email: string; role: string },
  status = 200
) => {
  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie("refreshToken", refreshToken, cookieOptions);
  return res.status(status).json({ user: sanitizeUser(user), accessToken });
};

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        role: toDbRole(data.role),
      },
    });

    return sendSession(res, user, 201);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: err.errors });
    }
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return sendSession(res, user);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: err.errors });
    }
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Login failed",
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(token, REFRESH_SECRET) as { userId: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    return sendSession(res, user);
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
  });
  return res.json({ message: "Logged out" });
};

export const me = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await prisma.user.findUnique({ where: { id: authReq.user.userId } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user: sanitizeUser(user) });
};
