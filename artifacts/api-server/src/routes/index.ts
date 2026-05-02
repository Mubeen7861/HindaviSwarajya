import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import usersRouter from "./users";
import statsRouter from "./stats";
import eventsRouter from "./events";
import helpRequestsRouter from "./help-requests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(usersRouter);
router.use(statsRouter);
router.use(eventsRouter);
router.use(helpRequestsRouter);

export default router;
