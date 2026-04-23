import { Router, type IRouter } from "express";
import healthRouter from "./health";
import devicesRouter from "./devices";
import readingsRouter from "./readings";
import alertsRouter from "./alerts";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(devicesRouter);
router.use(readingsRouter);
router.use(alertsRouter);
router.use(dashboardRouter);

export default router;
