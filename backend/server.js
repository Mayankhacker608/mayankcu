const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

dotenv.config();

const { connectDB } = require("./config/db");
const errorMiddleware = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const accountRoutes = require("./routes/accountRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

/* =========================================================
   SECURITY
========================================================= */

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5000",
  "http://127.0.0.1:5000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured frontend/local origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(`CORS blocked origin: ${origin}`);

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

/* =========================================================
   RATE LIMIT
========================================================= */

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "MayankCU backend is running",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/auth", authRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/accounts", accountRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/activities", activityRoutes);

/* =========================================================
   FRONTEND
========================================================= */

const frontendDir = path.join(__dirname, "../frontend");

app.use(express.static(frontendDir));

/* =========================================================
   FRONTEND PAGES
========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(frontendDir, "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(frontendDir, "register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(frontendDir, "dashboard.html"));
});

app.get("/customers", (req, res) => {
  res.sendFile(path.join(frontendDir, "customers.html"));
});

app.get("/accounts", (req, res) => {
  res.sendFile(path.join(frontendDir, "accounts.html"));
});

app.get("/transactions", (req, res) => {
  res.sendFile(path.join(frontendDir, "transactions.html"));
});

app.get("/payments", (req, res) => {
  res.sendFile(path.join(frontendDir, "payments.html"));
});

app.get("/reports", (req, res) => {
  res.sendFile(path.join(frontendDir, "reports.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(frontendDir, "profile.html"));
});

app.get("/account-details", (req, res) => {
  res.sendFile(path.join(frontendDir, "account-details.html"));
});

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      message: "API endpoint not found.",
    });
  }

  res.sendFile(path.join(frontendDir, "index.html"));
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(errorMiddleware);

/* =========================================================
   SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);

        console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error.message);

      process.exit(1);
    });
} else {
  connectDB().catch((error) => {
    console.error("Failed to initialize serverless app:", error.message);
  });
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = app;
