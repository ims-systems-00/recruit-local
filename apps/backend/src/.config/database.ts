import mongoose from "mongoose";

const constructDatabaseUrl = (mongoUrl: string, dbName: string): string => {
  if (!mongoUrl) throw new Error("MONGO_URL is not defined in the environment variables");
  if (!dbName) throw new Error("DATABASE_NAME is not defined in the environment variables");

  //  Split the URL to separate the base (host/port) from the query parameters
  const [baseUrl, queryParams] = mongoUrl.split("?");

  //  Remove trailing slash from base if present
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  // If queryParams is undefined, we just return base/dbName
  return queryParams ? `${cleanBaseUrl}/${dbName}?${queryParams}` : `${cleanBaseUrl}/${dbName}`;
};

const connectDB = async (): Promise<typeof mongoose> => {
  const DATABASE_URL = constructDatabaseUrl(process.env.MONGO_URL || "", process.env.DATABASE_NAME || "");

  try {
    const conn = await mongoose.connect(DATABASE_URL);
    return conn;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export { connectDB };
