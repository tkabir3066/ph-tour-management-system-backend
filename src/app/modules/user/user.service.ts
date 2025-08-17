import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { userSearchableFields } from "./user.constant";
import { QueryBuilder } from "../../utils/queryBuilder";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User Already Exist");
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
    if (decodedToken.role === Role.USER || decodedToken.role === Role.USER) {
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

  // delete picture from cloudinary before update if exist picture
  if (payload.picture && isUserExist.picture) {
    await deleteImageFromCloudinary(isUserExist.picture);
  }
  return newUpdatedUser;
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);
  const usersData = await queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build();

  const meta = await queryBuilder.getMeta();
  return {
    data: usersData,
    meta: meta,
  };
};
const getSingleUser = async (id: string) => {
  const user = await User.findById(id);

  return {
    data: user,
  };
};

export const UserServices = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
};
