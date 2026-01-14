import cors from "@elysiajs/cors";
import openapi, { fromTypes } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";
import { todoRoutes } from "./modules/todo/todo.routes";
import { chatSocket } from "./modules/chat/chat.socket";
import { authRoutes } from "./modules/auth/auth.plugin";
import { groupRoutes } from "./modules/groups/groups.routes";
import { channelRoutes } from "./modules/channels/channels.routes";
import { inviteRoutes } from "./modules/groups/invites.routes";
import { authPlugin } from "./plugins/auth";
import * as invitesService from "./modules/groups/invites.service";
import z from "zod";

const app = new Elysia()
  .use(cors())
  .use(openapi({
    references: fromTypes(),
    mapJsonSchema: {
      zod: z.toJSONSchema
    }
  }))
  .use(authRoutes)
  // Rota pública para validação de convite
  .get('/invites/validate/:token', async ({ params, set }) => {
    try {
      const result = await invitesService.validateInviteToken(params.token);
      return { data: result };
    } catch (error) {
      set.status = 400;
      return { error: error instanceof Error ? error.message : 'Convite inválido' };
    }
  })
  // Chat WebSocket (fora do authPlugin para facilitar conexão)
  .use(chatSocket)
  .group( // as rotas aqui são protegidas pelo middleware de auth
    '', (app) =>
      app
      .use(authPlugin())
      .use(todoRoutes)
      .use(groupRoutes)
      .use(inviteRoutes)
      .use(channelRoutes)
  )
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

