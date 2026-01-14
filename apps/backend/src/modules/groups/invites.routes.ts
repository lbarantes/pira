import Elysia from "elysia";
import * as invitesService from "./invites.service";
import * as groupsService from "./groups.service";
import { CreateGroupInviteSchema } from "shared-types";
import { user_groups } from "src/db/schema/groups";
import { db } from "src/db";
import { eq, and } from "drizzle-orm";

export const inviteRoutes = new Elysia({
    prefix: '/groups/:groupId/invites'
})
    // ===== CRIAR CONVITE =====
    .post(
        '/',
        async ({ params, body, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const result = await invitesService.createGroupInvite(
                    params.groupId,
                    userId,
                    body
                );
                set.status = 201;
                return result;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao criar convite' };
            }
        },
        {
            body: CreateGroupInviteSchema,
            as: 'json',
            detail: {
                tags: ['Group Invites'],
                summary: 'Criar link de convite',
                description: 'Gera um novo link de convite configurável para o grupo'
            }
        }
    )
    // ===== LISTAR CONVITES DO GRUPO =====
    .get(
        '/',
        async ({ params, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const invites = await invitesService.listGroupInvites(params.groupId, userId);
                return invites;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao listar convites' };
            }
        },
        {
            detail: {
                tags: ['Group Invites'],
                summary: 'Listar convites do grupo',
                description: 'Retorna todos os links de convite do grupo'
            }
        }
    )
    // ===== DESATIVAR CONVITE =====
    .post(
        '/:inviteId/deactivate',
        async ({ params, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const result = await invitesService.deactivateInvite(params.inviteId, userId);
                return result;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao desativar convite' };
            }
        },
        {
            detail: {
                tags: ['Group Invites'],
                summary: 'Desativar link de convite',
                description: 'Desativa um link de convite sem deletá-lo'
            }
        }
    )
    // ===== REATIVAR CONVITE =====
    .post(
        '/:inviteId/reactivate',
        async ({ params, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const result = await invitesService.reactivateInvite(params.inviteId, userId);
                return result;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao reativar convite' };
            }
        },
        {
            detail: {
                tags: ['Group Invites'],
                summary: 'Reativar link de convite',
                description: 'Reativa um link de convite previamente desativado'
            }
        }
    )
    // ===== DELETAR CONVITE =====
    .delete(
        '/:inviteId',
        async ({ params, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const result = await invitesService.deleteInvite(params.inviteId, userId);
                return result;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao deletar convite' };
            }
        },
        {
            detail: {
                tags: ['Group Invites'],
                summary: 'Deletar link de convite',
                description: 'Remove um link de convite completamente'
            }
        }
    )
    // ===== ENTRAR NO GRUPO COM CONVITE =====
    .post(
        '/join/:token',
        async ({ params, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                // Valida o token
                const validation = await invitesService.validateInviteToken(params.token);

                // Usa o token
                const groupId = await invitesService.useInviteToken(params.token);

                // Verifica se o usuário já está no grupo
                const existingMembership = await db.query.user_groups.findFirst({
                    where: and(
                        eq(user_groups.user_id, userId),
                        eq(user_groups.group_id, groupId)
                    )
                });

                if (existingMembership) {
                    set.status = 409;
                    return { error: 'Usuário já é membro deste grupo' };
                }

                // Adiciona o usuário ao grupo
                await db.insert(user_groups).values({
                    user_id: userId,
                    group_id: groupId,
                });

                set.status = 201;
                return {
                    data: {
                        message: 'Você entrou no grupo com sucesso',
                        group_id: groupId,
                        group_name: (validation.invite as any).group?.group_name
                    }
                };
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao entrar no grupo' };
            }
        },
        {
            detail: {
                tags: ['Group Invites'],
                summary: 'Entrar no grupo com convite',
                description: 'Permite que um usuário entre em um grupo usando um link de convite válido'
            }
        }
    )
