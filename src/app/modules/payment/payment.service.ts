/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS } from "../booking/booking.interface";
import Booking from "../booking/booking.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import Payment from "./payment.model";
import { StatusCodes } from "http-status-codes";

const initPayment = async (bookingId: string) => {
  const payment = await Payment.findOne({ booking: bookingId });

  if (!payment) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Payment not found. You have not booked this tour"
    );
  }

  const booking = await Booking.findById(payment.booking);
  const userAddress = (booking?.user as any).address;
  const userEmail = (booking?.user as any).email;
  const userPhoneNumber = (booking?.user as any).phone;
  const userName = (booking?.user as any).name;
  const sslPayload: ISSLCommerz = {
    address: userAddress,
    phoneNumber: userPhoneNumber,
    email: userEmail,
    name: userName,
    amount: payment.amount,
    transactionId: payment.transactionId,
  };

  const sslPayment = await SSLService.sslPaymentInit(sslPayload);
  console.log(sslPayment);
  return {
    paymentUrl: sslPayment.GatewayPageURL,
  };
};

const successPayment = async (query: Record<string, string>) => {
  //Update booking status to CONFIRM
  //Update payment status to PAID

  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },

      {
        status: PAYMENT_STATUS.PAID,
      },

      { new: true, runValidators: true, session }
    );

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      { status: BOOKING_STATUS.COMPLETE },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction(); //transaction
    session.endSession();
    return {
      success: true,
      message: "Payment Completed Successfully",
    };
  } catch (error) {
    session.abortTransaction(); //rollback
    session.endSession();

    throw error;
  }
};
const failPayment = async (query: Record<string, string>) => {
  //Update booking status to FAIL
  //Update payment status to FAIL
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },

      {
        status: PAYMENT_STATUS.FAILED,
      },

      { new: true, runValidators: true, session }
    );

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      { status: BOOKING_STATUS.FAILED },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction(); //transaction
    session.endSession();
    return {
      success: false,
      message: "Payment failed",
    };
  } catch (error) {
    session.abortTransaction(); //rollback
    session.endSession();

    throw error;
  }
};
const cancelPayment = async (query: Record<string, string>) => {
  //Update booking status to CANCEL
  //Update payment status to CANCEL
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },

      {
        status: PAYMENT_STATUS.CANCELLED,
      },

      { new: true, runValidators: true, session }
    );

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      { status: BOOKING_STATUS.CANCEL },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction(); //transaction
    session.endSession();
    return {
      success: false,
      message: "Payment cancelled",
    };
  } catch (error) {
    session.abortTransaction(); //rollback
    session.endSession();

    throw error;
  }
};

export const PaymentService = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
};
