import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";
import { generateKeyPairSync } from "crypto";
import fs from "fs";
import path from "path";

let mongoServer: MongoMemoryServer | null = null;

function ensureJWTKeys() {
  const keysDir = path.join(__dirname, "..", "..", "keys");
  const publicKeyPath = path.join(keysDir, "public.pem");
  const privateKeyPath = path.join(keysDir, "private.pem");

  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  if (!fs.existsSync(publicKeyPath) || !fs.existsSync(privateKeyPath)) {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    fs.writeFileSync(publicKeyPath, publicKey);
    fs.writeFileSync(privateKeyPath, privateKey);
  }
}

beforeAll(async () => {
  ensureJWTKeys();

  let mongoUri: string;

  if (process.env.USE_REAL_MONGO === "true") {
    mongoUri = process.env.DATABASE_URL || "mongodb://mongodb-test:27017/auth-test";
  } else {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
  }

  await mongoose.connect(mongoUri);
  await mongoose.connection.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
