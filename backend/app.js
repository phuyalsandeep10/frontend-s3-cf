// Load environment variables from .env file
require('dotenv').config();

console.log("DEBUG MONGO_URI:", "mongodb://localhost:27017/mern-admin");

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const cors = require("cors"); // ✅ NEW
const bodyParser = require("body-parser");
const promisify = require("es6-promisify");

const apiRouter = require("./routes/api");
const authApiRouter = require("./routes/authApi");
const errorHandlers = require("./handlers/errorHandlers");
const { isValidToken } = require("./controllers/authController");

// Initialize Express app
const app = express();

// ✅ CORS middleware (before routes)
app.use(cors({
  origin: "*", // allow frontend
  credentials: true // allow cookies and session headers
}));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Parse incoming JSON and URL-encoded payloads
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware with MongoDB store
app.use(
  session({
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl:  "mongodb://localhost:27017/mern-admin"}),
  })
);

// Make variables available to templates and all requests
app.use((req, res, next) => {
  res.locals.admin = req.admin || null;
  res.locals.currentPath = req.path;
  next();
});

// Promisify some callback-based APIs
app.use((req, res, next) => {
  req.login = promisify(req.login, req);
  next();
});

// ❌ REMOVE manual CORS headers – now handled by cors middleware
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header("Access-Control-Allow-Methods", "GET,PATCH,PUT,POST,DELETE");
//   res.header("Access-Control-Expose-Headers", "Content-Length");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Accept, Authorization, x-auth-token, Content-Type, X-Requested-With, Range"
//   );
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   } else {
//     return next();
//   }
// });

// API routes
app.use("/api", authApiRouter);
app.use("/api", apiRouter);
// app.use("/api", isValidToken, apiRouter); // optionally protect with token

// Handle 404 errors
app.use(errorHandlers.notFound);

// Development error handler - prints stack trace
if (app.get("env") === "development") {
  app.use(errorHandlers.developmentErrors);
}

// Production error handler - no stack traces leaked to user
app.use(errorHandlers.productionErrors);

// Export the app
module.exports = app;
