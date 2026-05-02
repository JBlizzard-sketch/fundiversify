import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tradesRouter from "./trades";
import contractorsRouter from "./contractors";
import jobsRouter from "./jobs";
import quotesRouter from "./quotes";
import reviewsRouter from "./reviews";
import disputesRouter from "./disputes";
import savedRouter from "./saved";
import estimateRouter from "./estimate";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tradesRouter);
router.use(contractorsRouter);
router.use(jobsRouter);
router.use(quotesRouter);
router.use(reviewsRouter);
router.use(disputesRouter);
router.use(savedRouter);
router.use(estimateRouter);
router.use(dashboardRouter);

export default router;
