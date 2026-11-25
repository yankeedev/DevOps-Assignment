import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import equipmentRoutes from "./routes/equipmentRoutes";
import adminRoutes from "./routes/adminRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import shopRoutes from "./routes/shopRoutes";
import { register, metricsMiddleware } from "./utils/metrics";

const app = express();
const frontendApp = express();
// FIX: Reverted to 5000 and 4173 to match Docker Compose and Prometheus
const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 4174;
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// FIX: Apply the metrics middleware to track API requests
app.use(metricsMiddleware);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "AgriRent API is running" });
});

// FIX: Expose the Prometheus metrics endpoint
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/equipment/:id/reviews", reviewRoutes);
app.use("/api/shops", shopRoutes);

frontendApp.use(express.static(frontendDist));

frontendApp.get("*", (_req, res) => {
  res.setHeader(
    "Cache-Control",
    "no-cache, no-store, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

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
      console.error(`Port ${PORT} is already in use.`);
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