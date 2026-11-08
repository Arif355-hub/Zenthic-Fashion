const dotenv = require("dotenv");
dotenv.config();
const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { apiLimiter } = require("./middleware/rateLimitMiddleware");
const mongoSanitize = require("@exortek/express-mongo-sanitize");
const connectDB = require("./config/db");

const app = express();

app.disable("x-powered-by");

// Trusted proxy configuration
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);

if (
  !Number.isInteger(trustProxyHops) ||
  trustProxyHops < 0
) {
  throw new Error("TRUST_PROXY_HOPS must be a non-negative integer.");
}

app.set("trust proxy", trustProxyHops);

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  })
);

app.use(express.json({ limit: "10kb" }));

// Duplicate query parameters reject karo
app.use((req, res, next) => {
  const hasDuplicateQuery = Object.values(req.query).some(
    (value) => Array.isArray(value)
  );

  if (hasDuplicateQuery) {
    return res.status(400).json({
      success: false,
      message: "Duplicate query parameters are not allowed.",
    });
  }

  next();
});

app.use(mongoSanitize());

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", apiLimiter, require("./routes/productRoutes"));
app.use("/api/orders", apiLimiter, require("./routes/orderRoutes"));
app.use(
  "/api/custom-orders",
  apiLimiter,
  require("./routes/customOrderRoutes")
);

// API 404
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// Home Route
app.get("/", (req, res) => {
  res.send("Zenthic Fashion API is Running!");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  const statusCode =
    err.status ||
    (err.name === "MulterError" ? 400 : 500);

  let message = "Something went wrong on the server.";

  if (statusCode === 400) {
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Artwork file cannot exceed 10 MB."
        : err.message || "Invalid file upload.";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
});

// Database connect hone ke baad hi server start hoga
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
