/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import { StatusCodes } from "http-status-codes";
import { UserServices } from "./user.service";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

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
};

//route matching -->controller --> service --> model --> DB
