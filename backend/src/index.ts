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

const app = express();
const frontendApp = express();
const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 4173;
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

// We use a dynamic origin function to handle any URL (localhost, ALB, etc.)
app.use(
  cors({
    origin: true, // This tells CORS to reflect the request's origin, allowing all domains
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
app.use("/api/bookings", bookingRoutes);
app.use("/api/equipment/:id/reviews", reviewRoutes);
app.use("/api/shops", shopRoutes);

// Serve static assets (JS, CSS, images). These can be cached because they have hashed filenames.
frontendApp.use(express.static(frontendDist));

// Catch-all route for React Router.
frontendApp.get("*", (_req, res) => {
  // FIX: Force the browser to NEVER cache index.html. This guarantees it always
  // grabs the latest JS bundle (where your new "Register" button lives).
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
      console.error(
        `Port ${PORT} is already in use. Stop the other process or set a different PORT in backend/.env`
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