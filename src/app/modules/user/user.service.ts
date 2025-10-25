import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User Already Exist", "");
  }

  //hashed password

  const hashedPassword = await bcrypt.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );
  console.log(hashedPassword);

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };
  const user = await User.create({
    email,
    password: hashedPassword,
    auths: [authProvider],
    ...rest,
  });

  return user;
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  /*
   *email -> can't update
   *name, password, phone, address
   * password --> re hashing
   *only admin and super admin can update --> role, isDeleted
   *promoting to super admin --> super admin
   */

  if (payload.role) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
      throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized");
    }

    // promoting to super admin --> super admin
    if (payload.role === Role.SUPER_ADMIN && decodedToken.role === Role.ADMIN) {
      throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized");
    }
  }

  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.USER) {
      throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized");
    }
  }

  //rehashing the password

  if (payload.password) {
    payload.password = await bcrypt.hash(
      payload.password,
      Number(envVars.BCRYPT_SALT_ROUND)
    );
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return newUpdatedUser;
};

const getAllUsers = async () => {
  const users = await User.find({});
  const totalUsers = await User.countDocuments();
  return {
    data: users,
    meta: {
      total: totalUsers,
    },
  };
};

export const UserServices = {
  createUser,
  getAllUsers,
  updateUser,
};
