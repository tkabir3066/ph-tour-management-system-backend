/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TErrorSources,
  TGenericErrorResponse,
} from "../interfaces/error.types";

export const handleZodError = (err: any): TGenericErrorResponse => {
  const errorSources: TErrorSources[] = [];
  const errors = err.issues;
  errors.map((errorObj: any) =>
    errorSources.push({
      path: errorObj.path.join(""),
      message: errorObj.message,
    })
  );
  return {
    statusCode: 400,
    message: "Zod Error Occurred",
    errorSources,
  };
};
