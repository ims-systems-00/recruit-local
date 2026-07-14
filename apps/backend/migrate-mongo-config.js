require("dotenv").config();

const config = {
  mongodb: {
    url: process.env.MONGO_URL,
    databaseName: process.env.DATABASE_NAME,
    options: {
      // connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      // socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },
  migrationsDir: "src/migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "commonjs",
};

module.exports = config;
