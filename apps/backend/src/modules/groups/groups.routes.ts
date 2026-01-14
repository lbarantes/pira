import Elysia from "elysia";
import * as groupsService from "./groups.service";
import { CreateGroupSchema, CreateGroupRoleSchema, UpdateGroupRolePermissionsSchema, AssignRoleToUserSchema } from "shared-types";

export const groupRoutes = new Elysia({
    prefix: '/groups'
})
    // ===== GROUPS =====
    .post(
        '/',
        async ({ body, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const group = await groupsService.createGroup(body, userId);
                set.status = 201;
                return group;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao criar grupo' };
            }
        },
        {
            body: CreateGroupSchema,
            as: 'json',
            detail: {
                tags: ['Groups'],
                summary: 'Criar novo grupo',
                description: 'Cria um novo grupo e adiciona o criador como membro'
            }
        }
    )
    .get(
        '/',
        async ({ set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const groups = await groupsService.getUserGroups(userId);
                return groups;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao buscar grupos' };
            }
        },
        {
            detail: {
                tags: ['Groups'],
                summary: 'Listar grupos do usuário',
                description: 'Retorna todos os grupos do qual o usuário é membro'
            }
        }
    )
    .get(
        '/:groupId',
        async ({ params, set }) => {
            try {
                const group = await groupsService.getGroupById(params.groupId);
                if (!group) {
                    set.status = 404;
                    return { error: 'Grupo não encontrado' };
                }
                return group;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao buscar grupo' };
            }
        },
        {
            detail: {
                tags: ['Groups'],
                summary: 'Buscar grupo por ID',
                description: 'Retorna os detalhes de um grupo específico'
            }
        }
    )
    .get(
        '/:groupId/members',
        async ({ params, set }) => {
            try {
                const members = await groupsService.getGroupMembers(params.groupId);
                return members;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao buscar membros do grupo' };
            }
        },
        {
            detail: {
                tags: ['Groups'],
                summary: 'Listar membros do grupo',
                description: 'Retorna todos os membros de um grupo específico'
            }
        }
    )
    .put(
        '/:groupId',
        async ({ params, body, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const group = await groupsService.updateGroup(params.groupId, body, userId);
                return group;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao atualizar grupo' };
            }
        },
        {
            body: CreateGroupSchema.partial(),
            as: 'json',
            detail: {
                tags: ['Groups'],
                summary: 'Atualizar grupo',
                description: 'Atualiza os detalhes de um grupo (apenas o proprietário pode atualizar)'
            }
        }
    )
    .delete(
        '/:groupId',
        async ({ params, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const result = await groupsService.deleteGroup(params.groupId, userId);
                return result;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao deletar grupo' };
            }
        },
        {
            detail: {
                tags: ['Groups'],
                summary: 'Deletar grupo',
                description: 'Deleta um grupo (apenas o proprietário pode deletar)'
            }
        }
    )
    // ===== GROUP ROLES =====
    .post(
        '/:groupId/roles',
        async ({ params, body, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const role = await groupsService.createGroupRole(params.groupId, body, userId);
                set.status = 201;
                return role;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao criar cargo' };
            }
        },
        {
            body: CreateGroupRoleSchema,
            as: 'json',
            detail: {
                tags: ['Group Roles'],
                summary: 'Criar novo cargo no grupo',
                description: 'Cria um novo cargo/função no grupo'
            }
        }
    )
    .get(
        '/:groupId/roles',
        async ({ params, set }) => {
            try {
                const roles = await groupsService.getGroupRoles(params.groupId);
                return roles;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao buscar cargos' };
            }
        },
        {
            detail: {
                tags: ['Group Roles'],
                summary: 'Listar cargos do grupo',
                description: 'Retorna todos os cargos disponíveis no grupo'
            }
        }
    )
    .put(
        '/:groupId/roles/:roleId',
        async ({ params, body, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const role = await groupsService.updateGroupRole(params.roleId, body, userId);
                return role;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao atualizar cargo' };
            }
        },
        {
            body: CreateGroupRoleSchema.partial(),
            as: 'json',
            detail: {
                tags: ['Group Roles'],
                summary: 'Atualizar cargo',
                description: 'Atualiza os detalhes de um cargo do grupo'
            }
        }
    )
    .delete(
        '/:groupId/roles/:roleId',
        async ({ params, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const result = await groupsService.deleteGroupRole(params.roleId, userId);
                return result;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao deletar cargo' };
            }
        },
        {
            detail: {
                tags: ['Group Roles'],
                summary: 'Deletar cargo',
                description: 'Deleta um cargo do grupo'
            }
        }
    )
    // ===== GROUP ROLE PERMISSIONS =====
    .post(
        '/:groupId/roles/:roleId/permissions',
        async ({ params, body, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const permissions = await groupsService.setGroupRolePermissions(
                    params.groupId,
                    params.roleId,
                    body,
                    userId
                );
                return permissions;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao definir permissões' };
            }
        },
        {
            body: UpdateGroupRolePermissionsSchema,
            as: 'json',
            detail: {
                tags: ['Group Permissions'],
                summary: 'Definir permissões de cargo',
                description: 'Define ou atualiza as permissões associadas a um cargo no grupo'
            }
        }
    )
    .get(
        '/:groupId/roles/:roleId/permissions',
        async ({ params, set }) => {
            try {
                const permissions = await groupsService.getGroupRolePermissions(
                    params.groupId,
                    params.roleId
                );
                if (!permissions) {
                    set.status = 404;
                    return { error: 'Permissões não encontradas' };
                }
                return permissions;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao buscar permissões' };
            }
        },
        {
            detail: {
                tags: ['Group Permissions'],
                summary: 'Buscar permissões de cargo',
                description: 'Retorna todas as permissões associadas a um cargo'
            }
        }
    )
    // ===== USER GROUP ROLES =====
    .post(
        '/:groupId/users/:userId/roles',
        async ({ params, body, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const userRole = await groupsService.assignRoleToUser(
                    params.userId,
                    params.groupId,
                    body.role_id,
                    userId
                );
                set.status = 201;
                return userRole;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao atribuir cargo' };
            }
        },
        {
            body: AssignRoleToUserSchema,
            as: 'json',
            detail: {
                tags: ['User Group Roles'],
                summary: 'Atribuir cargo a usuário',
                description: 'Atribui um cargo/papel de grupo a um usuário'
            }
        }
    )
    .delete(
        '/:groupId/users/:userId/roles/:roleId',
        async ({ params, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const result = await groupsService.removeRoleFromUser(
                    params.userId,
                    params.groupId,
                    params.roleId,
                    userId
                );
                return result;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao remover cargo' };
            }
        },
        {
            detail: {
                tags: ['User Group Roles'],
                summary: 'Remover cargo de usuário',
                description: 'Remove um cargo/papel atribuído a um usuário'
            }
        }
    )
    .get(
        '/:groupId/users/:userId/roles',
        async ({ params, set }) => {
            try {
                const roles = await groupsService.getUserGroupRoles(params.userId, params.groupId);
                return roles;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao buscar cargos do usuário' };
            }
        },
        {
            detail: {
                tags: ['User Group Roles'],
                summary: 'Listar cargos de usuário',
                description: 'Retorna todos os cargos/papéis atribuídos a um usuário em um grupo'
            }
        }
    )
