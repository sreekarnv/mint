import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  signupReqBodySchema,
  signupResBodySchema,
  loginReqBodySchema,
  loginResBodySchema,
  userResSchema,
} from "~/schemas/auth.schema";
import { env } from "~/env";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.register("User", userResSchema.openapi("User"));
registry.register("SignupRequest", signupReqBodySchema.openapi("SignupRequest"));
registry.register("SignupResponse", signupResBodySchema.openapi("SignupResponse"));
registry.register("LoginRequest", loginReqBodySchema.openapi("LoginRequest"));
registry.register("LoginResponse", loginResBodySchema.openapi("LoginResponse"));

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/signup",
  tags: ["Authentication"],
  summary: "Register a new user",
  description: "Create a new user account with email and password. Returns user details and sets authentication cookie.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: signupReqBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User successfully registered",
      content: {
        "application/json": {
          schema: signupResBodySchema,
        },
      },
    },
    400: {
      description: "Invalid request body or validation error",
    },
    409: {
      description: "User with this email already exists",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/login",
  tags: ["Authentication"],
  summary: "Login user",
  description: "Authenticate user with email and password. Returns user details and sets authentication cookie.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginReqBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User successfully authenticated",
      content: {
        "application/json": {
          schema: loginResBodySchema,
        },
      },
    },
    400: {
      description: "Invalid request body",
    },
    401: {
      description: "Invalid credentials",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/logout",
  tags: ["Authentication"],
  summary: "Logout user",
  description: "Clear authentication cookie and logout user.",
  responses: {
    200: {
      description: "Successfully logged out",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Logged out successfully" },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/user",
  tags: ["Authentication"],
  summary: "Get current user",
  description: "Get details of currently authenticated user.",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: "Current user details",
      content: {
        "application/json": {
          schema: userResSchema,
        },
      },
    },
    401: {
      description: "Not authenticated",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/.well-known/jwks.json",
  tags: ["Authentication"],
  summary: "Get JWKS keys",
  description: "Get JSON Web Key Set for JWT verification.",
  responses: {
    200: {
      description: "JWKS keys",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              keys: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    kty: { type: "string" },
                    use: { type: "string" },
                    alg: { type: "string" },
                    kid: { type: "string" },
                    n: { type: "string" },
                    e: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "token",
  description: "HTTP-only cookie with JWT token",
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Mint Auth API",
    version: "1.0.0",
    description:
      "Authentication service for Mint wallet platform. Handles user registration, login, JWT generation, and JWKS endpoints.",
    contact: {
      name: "Sreekar Venkata Nutulapati",
      url: "https://github.com/sreekarnv/mint",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost",
      description: env.NODE_ENV === "production" ? "Production" : "Development",
    },
  ],
  tags: [
    {
      name: "Authentication",
      description: "User authentication and authorization endpoints",
    },
  ],
});
