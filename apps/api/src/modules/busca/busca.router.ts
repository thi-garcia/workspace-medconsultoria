import { z } from "zod";
import { router, funcionarioProcedure } from "../../trpc/trpc.js";
import { buscaGlobal } from "./busca.service.js";

// Busca interna (equipe) — exclui CLIENTE (Portal tem escopo próprio).
export const buscaRouter = router({
  global: funcionarioProcedure
    .input(z.object({ termo: z.string() }))
    .query(({ input }) => buscaGlobal(input.termo)),
});
