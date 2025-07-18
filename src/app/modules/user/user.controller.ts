/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import { StatusCodes } from "http-status-codes";
import { UserServices } from "./user.service";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { verifyToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";

/* const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // throw new Error("fake errooorrr");
    // throw new AppError(StatusCodes.BAD_REQUEST, "fake error", "");
    const user = await UserServices.createUser(req.body);
    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user,
    });
  } catch (error: any) {
    console.log(error);
    next(error);
  }
}; */

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "User created successfully",
      data: user,
    });
  }
);
const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const token = req.headers.authorization;

    const payload = req.body;
    /*   const verifiedToken = verifyToken(
      token as string,
      envVars.JWT_ACCESS_SECRET
    ) as JwtPayload; */

    const verifiedToken = req.user;
    const user = await UserServices.updateUser(userId, payload, verifiedToken);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "User updated successfully",
      data: user,
    });
  }
);

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.getAllUsers();

    // res.status(StatusCodes.OK).json({
    //   success: true,
    //   message: "All Users Retrieved Successfully",
    //   users,
    // });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "All users retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);
export const UserControllers = {
  createUser,
  getAllUsers,
  updateUser,
};

//route matching -->controller --> service --> model --> DB
