import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import postsRouter from "./posts";
import usersRouter from "./users";
import statsRouter from "./stats";
import eventsRouter from "./events";
import helpRequestsRouter from "./help-requests";
import adminRouter from "./admin";
import bannersRouter from "./banners";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(postsRouter);
router.use(usersRouter);
router.use(statsRouter);
router.use(eventsRouter);
router.use(helpRequestsRouter);
router.use(adminRouter);
router.use(bannersRouter);
router.use(storageRouter);

export default router;
