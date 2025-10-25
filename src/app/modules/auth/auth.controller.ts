/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userTokens";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const loginInfo = await AuthServices.credentialsLogin(req.body);

    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        // return next(err);
        return next(new AppError(401, err));
      }
      if (!user) {
        return next(new AppError(401, info.message));
      }

      const userTokens = createUserTokens(user);

      delete user.toObject().password;

      setAuthCookie(res, userTokens);
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "User Logged in successfully",
        data: {
          accessToken: userTokens.accessToken,
          refreshToken: userTokens.refreshToken,
          user: user,
        },
      });
    })(req, res, next);

    // res.cookie("refreshToken", loginInfo.refreshToken, {
    //   httpOnly: true,
    //   secure: false,
    // });
  }
);

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "No refresh token received from cookies"
      );
    }
    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string
    );

    // res.cookie("accessToken", tokenInfo.accessToken, {
    //   httpOnly: true,
    //   secure: false,
    // });

    setAuthCookie(res, tokenInfo);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "New access token retrieved successfully",
      data: tokenInfo,
    });
  }
);
const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User Logged out successfully",
      data: null,
    });
  }
);

const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newPassword = req.body.newPassword;
    const oldPassword = req.body.oldPassword;
    const decodedToken = req.user;

    await AuthServices.changePassword(
      oldPassword,
      newPassword,
      decodedToken as JwtPayload
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User Changed successfully",
      data: null,
    });
  }
);

const setPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const { password } = req.body;

    await AuthServices.setPassword(decodedToken.userId, password);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Password Changed successfully",
      data: null,
    });
  }
);
const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    await AuthServices.forgotPassword(email);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Email sent successfully",
      data: null,
    });
  }
);

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, newPassword } = req.body;
    const decodedToken = req.user;

    await AuthServices.resetPassword(
      newPassword,
      id,
      decodedToken as JwtPayload
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User Changed successfully",
      data: null,
    });
  }
);
const googleCallbackController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let redirectTo = req.query.state ? (req.query.state as string) : "";

    if (redirectTo.startsWith("/")) {
      redirectTo = redirectTo.slice(1);
    }
    const user = req.user;

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    const tokenInfo = createUserTokens(user);

    // set the token info in cookie
    setAuthCookie(res, tokenInfo);
    // sendResponse(res, {
    //   success: true,
    //   statusCode: StatusCodes.OK,
    //   message: "User Changed successfully",
    //   data: null,
    // });

    res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`);
  }
);
export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
  changePassword,
  resetPassword,
  setPassword,
  forgotPassword,
  googleCallbackController,
};
