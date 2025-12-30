import express from "express";
import { authRouter } from "~/routers/auth.router";
import { usersRouter } from "~/routers/users.router";
import { jwksRouter } from "~/routers/jwks.router";
import cookieParser from "cookie-parser";
import { errorHandler, notFoundHandler } from "~/middleware/error-handler";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import hpp from "hpp";
import compression from "compression";
import { env } from "~/env";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "~/swagger";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "https://api.mint.com"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600,
  }),
);

const limiter =
  env.NODE_ENV === "test"
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX,
        message: "Too many requests from this IP, please try again later.",
        standardHeaders: true,
        legacyHeaders: false,
      });

const authLimiter =
  env.NODE_ENV === "test"
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: "Too many authentication attempts, please try again later.",
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
      });

app.use(limiter);

app.use(hpp());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "auth" });
});

app.use("/.well-known", jwksRouter);
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/users", usersRouter);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Mint Auth API Docs",
  }),
);

app.use(notFoundHandler);

app.use(errorHandler);

export { app };
