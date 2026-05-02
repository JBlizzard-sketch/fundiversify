import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tradesRouter from "./trades";
import contractorsRouter from "./contractors";
import jobsRouter from "./jobs";
import messagesRouter from "./messages";
import quotesRouter from "./quotes";
import reviewsRouter from "./reviews";
import disputesRouter from "./disputes";
import savedRouter from "./saved";
import estimateRouter from "./estimate";
import dashboardRouter from "./dashboard";
import storageRouter from "./storage";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tradesRouter);
router.use(contractorsRouter);
router.use(jobsRouter);
router.use(messagesRouter);
router.use(quotesRouter);
router.use(reviewsRouter);
router.use(disputesRouter);
router.use(savedRouter);
router.use(estimateRouter);
router.use(dashboardRouter);
router.use(storageRouter);
router.use(notificationsRouter);

export default router;
