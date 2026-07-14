import { router, funcionarioProcedure } from "../../trpc/trpc.js";
import { listStages } from "./pipeline.service.js";

export const pipelineRouter = router({
  stages: funcionarioProcedure.query(() => listStages()),
});
