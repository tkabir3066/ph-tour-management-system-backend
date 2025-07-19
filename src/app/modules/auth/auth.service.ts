import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { IsActive, IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import { createUserTokens } from "../../utils/userTokens";
import { generateToken, verifyToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";

const credentialsLogin = async (payload: Partial<IUser>) => {
  const { email, password } = payload;
  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User does not exist with this email"
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password as string,
    isUserExist.password as string
  );

  if (!isPasswordMatched) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Incorrect Password");
  }

  // const jwtPayload = {
  //   userId: isUserExist._id,
  //   email: isUserExist.email,
  //   role: isUserExist.role,
  // };
  // const accessToken = generateToken(
  //   jwtPayload,
  //   envVars.JWT_ACCESS_SECRET,
  //   envVars.JWT_ACCESS_EXPIRES
  // );

  // const refreshToken = generateToken(
  //   jwtPayload,
  //   envVars.JWT_REFRESH_SECRET,
  //   envVars.JWT_REFRESH_EXPIRES
  // );

  const userTokens = createUserTokens(isUserExist);
  const userData = isUserExist.toObject();
  delete userData.password;
  return {
    accessToken: userTokens.accessToken,
    refreshToken: userTokens.refreshToken,
    user: userData,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const verifiedRefreshToken = verifyToken(
    refreshToken,
    envVars.JWT_REFRESH_SECRET
  ) as JwtPayload;
  const isUserExist = await User.findOne({ email: verifiedRefreshToken.email });

  if (!isUserExist) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User does not exist with this email"
    );
  }
  if (
    isUserExist.isActive === IsActive.BLOCKED ||
    isUserExist.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `User is ${isUserExist.isActive}`
    );
  }
  if (isUserExist.isDeleted === IsActive.BLOCKED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is blocked");
  }

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  return {
    accessToken: accessToken,
  };
};
export const AuthServices = {
  credentialsLogin,
  getNewAccessToken,
};
