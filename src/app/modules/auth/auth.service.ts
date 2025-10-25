/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createNewAccessTokenWithAccessToken } from "../../utils/userTokens";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { IAuthProvider, IsActive } from "../user/user.interface";
import { sendEmail } from "../../utils/sendEmail";

// const credentialsLogin = async (payload: Partial<IUser>) => {
//   const { email, password } = payload;
//   const isUserExist = await User.findOne({ email });

//   if (!isUserExist) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       "User does not exist with this email"
//     );
//   }

//   const isPasswordMatched = await bcrypt.compare(
//     password as string,
//     isUserExist.password as string
//   );

//   if (!isPasswordMatched) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "Incorrect Password");
//   }

//   // const jwtPayload = {
//   //   userId: isUserExist._id,
//   //   email: isUserExist.email,
//   //   role: isUserExist.role,
//   // };
//   // const accessToken = generateToken(
//   //   jwtPayload,
//   //   envVars.JWT_ACCESS_SECRET,
//   //   envVars.JWT_ACCESS_EXPIRES
//   // );

//   // const refreshToken = generateToken(
//   //   jwtPayload,
//   //   envVars.JWT_REFRESH_SECRET,
//   //   envVars.JWT_REFRESH_EXPIRES
//   // );

//   const userTokens = createUserTokens(isUserExist);
//   const userData = isUserExist.toObject();
//   delete userData.password;
//   return {
//     accessToken: userTokens.accessToken,
//     refreshToken: userTokens.refreshToken,
//     user: userData,
//   };
// };

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken =
    await createNewAccessTokenWithAccessToken(refreshToken);

  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(decodedToken.userId);
  const isOldPasswordMatch = await bcrypt.compare(
    oldPassword,
    user!.password as string
  );

  if (!isOldPasswordMatch) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Old Password Doest not match"
    );
  }

  user!.password = await bcrypt.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  await user!.save();
};
const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (
    user.password &&
    user.auths.some((providerObj) => providerObj.provider === "google")
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You have already set your password. Now you can change the password from your profile password update"
    );
  }

  //hashed password

  const hashedPassword = await bcrypt.hash(
    plainPassword,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const credentialsProvider: IAuthProvider = {
    provider: "credentials",
    providerId: user.email,
  };

  const auths: IAuthProvider[] = [...user.auths, credentialsProvider];
  user.password = hashedPassword;
  user.auths = auths;

  await user.save();
  return {};
};
const forgotPassword = async (email: string) => {
  const isUserExist = await User.findOne({ email });

  if (!isUserExist?.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not verified");
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
  if (isUserExist.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
  }

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const resetToken = jwt.sign(jwtPayload, envVars.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });

  const resetUILink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;

  sendEmail({
    to: isUserExist.email,
    subject: "Password Reset",
    templateName: "forgetPassword",
    templateData: {
      name: isUserExist.name,
      resetUILink,
    },
  });

  /* 
  http://localhost:5173/reset-password?id=68a413fee2e2b89eab5ab218&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGE0MTNmZWUyZTJiODllYWI1YWIyMTgiLCJlbWFpbCI6IndlYi50dXR1bGthYmlyQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzU1NTgzODU1LCJleHAiOjE3NTU1ODQ0NTV9.XTMy-2Fqrk9OeAORYM22i1jycxQhm5VQ8RpONrdjpp4
  */
};

const resetPassword = async (
  newPassword: string,
  id: string,
  decodedToken: JwtPayload
) => {
  return {};
};
export const AuthServices = {
  // credentialsLogin,
  getNewAccessToken,
  changePassword,
  setPassword,
  resetPassword,
  forgotPassword,
};
