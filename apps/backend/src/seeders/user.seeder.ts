import { User } from "../models";
import { EMAIL_VERIFICATION_STATUS_ENUMS } from "../models/constants";
import { logger } from "../common/helper/logger";
import { USER_TYPE_ENUMS } from "@rl/types";

const validateEnv = () => {
  if (!process.env.ADMIN_USER_EMAIL || !process.env.ADMIN_USER_PASSWORD) {
    throw new Error("Admin email or password is not set in environment variables");
  }
};

const checkIfUserExists = async (email: string) => {
  return User.findOne({ email });
};

const createUser = async (user: any) => {
  const newUser = new User(user);
  return newUser.save();
};

export const userSeeder = async () => {
  try {
    validateEnv();

    const users = [
      {
        firstName: "Admin",
        lastName: "User",
        email: process.env.ADMIN_USER_EMAIL as string,
        password: process.env.ADMIN_USER_PASSWORD as string,
        type: USER_TYPE_ENUMS.ADMIN,
        emailVerificationStatus: EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED,
      },
    ];

    // Filter out users that already exist
    await Promise.all(
      users.map(async (user) => {
        const existingUser = await checkIfUserExists(user.email);
        if (!existingUser) await createUser(user);
      })
    );

    logger.info("Users seeding completed.");
  } catch (error) {
    logger.error("Error seeding users", error);
  }
};
