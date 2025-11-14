import mongoose from "mongoose";

const constructDatabaseUrl = (mongoUrl: string, dbName: string): string => {
  if (!mongoUrl) throw new Error("MONGO_URL is not defined in the environment variables");
  if (!dbName) throw new Error("DATABASE_NAME is not defined in the environment variables");

  return `${mongoUrl}/${dbName}`;
};

const connectDB = (): Promise<typeof mongoose> => {
  const DATABASE_URL = constructDatabaseUrl(process.env.MONGO_URL, process.env.DATABASE_NAME);

  return mongoose.connect(DATABASE_URL);
};

export { connectDB };
