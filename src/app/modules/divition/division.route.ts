import { Router } from "express";
import { DivisionControllers } from "./division.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createDivisionSchema,
  updateDivisionSchema,
} from "./division.validation";

const router = Router();

router.post(
  "/create",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createDivisionSchema),
  DivisionControllers.createDivision
);

router.get("/", DivisionControllers.getAllDivisions);

router.get("/:slug", DivisionControllers.getSingleDivision);
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateDivisionSchema),
  DivisionControllers.updateDivision
);
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DivisionControllers.deleteDivision
);
export const DivisionRoutes = router;
