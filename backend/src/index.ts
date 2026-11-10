import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import equipmentRoutes from "./routes/equipmentRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();
const frontendApp = express();
const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 4173;
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const isLocalHost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      if (isLocalHost) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "AgriRent API is running" });
});

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/admin", adminRoutes);

frontendApp.use(express.static(frontendDist));
frontendApp.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  const frontendServer = frontendApp.listen(FRONTEND_PORT, () => {
    console.log(`Frontend running on http://localhost:${FRONTEND_PORT}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other process (e.g. another "npm run dev") or set a different PORT in backend/.env`
      );
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  });

  const shutdown = () => {
    server.close(() => {
      frontendServer.close(() => process.exit(0));
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

export default app;
