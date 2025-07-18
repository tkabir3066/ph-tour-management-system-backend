import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError";
import { verifyToken } from "../utils/jwt";
import { envVars } from "../config/env";
import { JwtPayload } from "jsonwebtoken";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;
      if (!accessToken) {
        throw new AppError(StatusCodes.FORBIDDEN, "No token received", "");
      }

      const verifiedToken = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      // authRoles = ["ADMIN", "SUPER_ADMIN"]
      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to view this route",
          ""
        );
      }

      req.user = verifiedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
