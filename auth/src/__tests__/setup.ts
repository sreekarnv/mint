import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
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
