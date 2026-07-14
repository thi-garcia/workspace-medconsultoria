import { router, funcionarioProcedure } from "../../trpc/trpc.js";
import { dashboard } from "./dashboard.service.js";

export const dashboardRouter = router({
  resumo: funcionarioProcedure.query(({ ctx }) => dashboard(ctx.user.id, ctx.user.role)),
});
