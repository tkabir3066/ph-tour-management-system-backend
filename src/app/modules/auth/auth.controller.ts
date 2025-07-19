/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User Logged in successfully",
      data: loginInfo,
    });
  }
);
const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.headers.authorization;
    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User Logged in successfully",
      data: tokenInfo,
    });
  }
);

export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
};
