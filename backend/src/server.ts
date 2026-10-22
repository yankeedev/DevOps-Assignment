import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import equipmentRoutes from "./routes/equipmentRoutes";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/auth.routes";

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "AgriRent API is running" });
});

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/admin", adminRoutes);

const startServer = (preferredPort: number) => {
  const server = app.listen(preferredPort, () => {
    console.log(`Server running on http://localhost:${preferredPort}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = preferredPort + 1;
      console.warn(`Port ${preferredPort} is busy. Trying ${nextPort} instead...`);
      startServer(nextPort);
      return;
    }

    console.error("Failed to start server:", error);
    process.exit(1);
  });
};

if (require.main === module) {
  startServer(PORT);
}

export default app;