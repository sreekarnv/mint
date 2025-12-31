import type { Schema } from "mongoose";
import { dbQueryDuration } from "./metrics";

export function mongooseMetricsPlugin(schema: Schema) {
  const operations = [
    "count",
    "countDocuments",
    "deleteMany",
    "deleteOne",
    "find",
    "findOne",
    "findOneAndDelete",
    "findOneAndUpdate",
    "update",
    "updateMany",
    "updateOne",
  ];

  operations.forEach((operation) => {
    schema.pre(operation, function () {
      // @ts-expect-error - Mongoose internal property
      this._startTime = Date.now();
    });

    schema.post(operation, function () {
      // @ts-expect-error - Mongoose internal property
      const duration = (Date.now() - this._startTime) / 1000;
      const collection = this.model?.collection?.collectionName || "unknown";

      dbQueryDuration.observe(
        {
          operation,
          collection,
        },
        duration,
      );
    });
  });

  // Hook into save operations
  schema.pre("save", function () {
    // @ts-expect-error - Custom property
    this._startTime = Date.now();
  });

  schema.post("save", function () {
    // @ts-expect-error - Custom property
    const duration = (Date.now() - this._startTime) / 1000;
    const collection = this.collection?.collectionName || "unknown";

    dbQueryDuration.observe(
      {
        operation: "save",
        collection,
      },
      duration,
    );
  });
}
