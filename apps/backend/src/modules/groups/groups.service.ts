import { eq, and } from "drizzle-orm";
import { CreateGroup, UpdateGroup, CreateGroupRole, UpdateGroupRolePermissions } from "shared-types";
import { db } from "src/db";
import { groups, groupRoles, groupRolePermissions, user_groups, user_groups_roles } from "src/db/schema/groups";

// ===== GROUPS =====
export const createGroup = async (data: CreateGroup, ownerId: string) => {
    const [newGroup] = await db.insert(groups).values({
        group_name: data.group_name,
        group_description: data.group_description,
        group_avatar: data.group_avatar,
        group_owner: ownerId,
        group_status: 'active',
    }).returning({
        id: groups.id,
        group_name: groups.group_name,
        group_description: groups.group_description,
        group_avatar: groups.group_avatar,
        group_owner: groups.group_owner,
        group_status: groups.group_status,
        created_at: groups.created_at,
        updated_at: groups.updated_at,
    });

    // Adicionar o owner como membro do grupo
    await db.insert(user_groups).values({
        user_id: ownerId,
        group_id: newGroup.id,
    });

    return newGroup;
};

export const getGroupById = async (groupId: string) => {
    return await db.query.groups.findFirst({
        where: eq(groups.id, groupId),
    });
};

export const getUserGroups = async (userId: string) => {
    return await db.query.user_groups.findMany({
        where: eq(user_groups.user_id, userId),
        with: {
            group: true,
        },
    });
};

export const getGroupMembers = async (groupId: string) => {
    return await db.query.user_groups.findMany({
        where: eq(user_groups.group_id, groupId),
        with: {
            user: true,
        },
    });
};

export const updateGroup = async (groupId: string, data: UpdateGroup, ownerId: string) => {
    // Verificar se o usuário é o dono do grupo
    const group = await db.query.groups.findFirst({
        where: eq(groups.id, groupId),
    });

    if (!group || group.group_owner !== ownerId) {
        throw new Error('Você não tem permissão para atualizar este grupo.');
    }

    const [updatedGroup] = await db.update(groups)
        .set({
            ...(data.group_name && { group_name: data.group_name }),
            ...(data.group_description && { group_description: data.group_description }),
            ...(data.group_avatar && { group_avatar: data.group_avatar }),
            ...(data.group_status && { group_status: data.group_status }),
            updated_at: new Date(),
        })
        .where(eq(groups.id, groupId))
        .returning();

    return updatedGroup;
};

export const deleteGroup = async (groupId: string, ownerId: string) => {
    const group = await db.query.groups.findFirst({
        where: eq(groups.id, groupId),
    });

    if (!group || group.group_owner !== ownerId) {
        throw new Error('Você não tem permissão para deletar este grupo.');
    }

    await db.delete(groups).where(eq(groups.id, groupId));
    return { message: 'Grupo deletado com sucesso.' };
};

// ===== GROUP ROLES =====
export const createGroupRole = async (groupId: string, data: CreateGroupRole, userId: string) => {
    // Verificar se o usuário é o dono do grupo ou tem permissão
    const group = await db.query.groups.findFirst({
        where: eq(groups.id, groupId),
    });

    if (!group) {
        throw new Error('Grupo não encontrado.');
    }

    if (group.group_owner !== userId) {
        throw new Error('Você não tem permissão para criar cargos neste grupo.');
    }

    const [newRole] = await db.insert(groupRoles).values({
        group_id: groupId,
        role_name: data.role_name,
        role_color: data.role_color,
    }).returning();

    return newRole;
};

export const getGroupRoles = async (groupId: string) => {
    return await db.query.groupRoles.findMany({
        where: eq(groupRoles.group_id, groupId),
    });
};

export const updateGroupRole = async (roleId: string, data: { role_name?: string; role_color?: string }, userId: string) => {
    const role = await db.query.groupRoles.findFirst({
        where: eq(groupRoles.id, roleId),
    });

    if (!role) {
        throw new Error('Cargo não encontrado.');
    }

    const group = await db.query.groups.findFirst({
        where: eq(groups.id, role.group_id),
    });

    if (!group || group.group_owner !== userId) {
        throw new Error('Você não tem permissão para atualizar este cargo.');
    }

    const [updatedRole] = await db.update(groupRoles)
        .set({
            ...(data.role_name && { role_name: data.role_name }),
            ...(data.role_color && { role_color: data.role_color }),
        })
        .where(eq(groupRoles.id, roleId))
        .returning();

    return updatedRole;
};

export const deleteGroupRole = async (roleId: string, userId: string) => {
    const role = await db.query.groupRoles.findFirst({
        where: eq(groupRoles.id, roleId),
    });

    if (!role) {
        throw new Error('Cargo não encontrado.');
    }

    const group = await db.query.groups.findFirst({
        where: eq(groups.id, role.group_id),
    });

    if (!group || group.group_owner !== userId) {
        throw new Error('Você não tem permissão para deletar este cargo.');
    }

    await db.delete(groupRoles).where(eq(groupRoles.id, roleId));
    return { message: 'Cargo deletado com sucesso.' };
};

// ===== GROUP ROLE PERMISSIONS =====
export const setGroupRolePermissions = async (groupId: string, roleId: string, data: UpdateGroupRolePermissions, userId: string) => {
    const group = await db.query.groups.findFirst({
        where: eq(groups.id, groupId),
    });

    if (!group || group.group_owner !== userId) {
        throw new Error('Você não tem permissão para definir permissões neste grupo.');
    }

    const role = await db.query.groupRoles.findFirst({
        where: eq(groupRoles.id, roleId),
    });

    if (!role || role.group_id !== groupId) {
        throw new Error('Cargo não encontrado neste grupo.');
    }

    const existingPermissions = await db.query.groupRolePermissions.findFirst({
        where: and(
            eq(groupRolePermissions.group_id, groupId),
            eq(groupRolePermissions.role_id, roleId)
        ),
    });

    let permissions;

    if (existingPermissions) {
        [permissions] = await db.update(groupRolePermissions)
            .set({
                ...data,
            })
            .where(and(
                eq(groupRolePermissions.group_id, groupId),
                eq(groupRolePermissions.role_id, roleId)
            ))
            .returning();
    } else {
        [permissions] = await db.insert(groupRolePermissions).values({
            group_id: groupId,
            role_id: roleId,
            is_admin: data.is_admin ?? false,
            group_can_manage_roles: data.group_can_manage_roles ?? false,
            group_can_view_channels: data.group_can_view_channels ?? false,
            group_can_manage_channels: data.group_can_manage_channels ?? false,
            members_can_invite: data.members_can_invite ?? false,
            members_can_kick: data.members_can_kick ?? false,
            members_can_ban: data.members_can_ban ?? false,
            chat_can_send_messages: data.chat_can_send_messages ?? false,
            chat_can_send_links: data.chat_can_send_links ?? false,
            chat_can_send_files: data.chat_can_send_files ?? false,
            chat_can_manage_messages: data.chat_can_manage_messages ?? false,
            chat_can_fix_messages: data.chat_can_fix_messages ?? false,
            chat_can_view_history: data.chat_can_view_history ?? false,
        }).returning();
    }

    return permissions;
};

export const getGroupRolePermissions = async (groupId: string, roleId: string) => {
    return await db.query.groupRolePermissions.findFirst({
        where: and(
            eq(groupRolePermissions.group_id, groupId),
            eq(groupRolePermissions.role_id, roleId)
        ),
    });
};

// ===== USER GROUP ROLES =====
export const assignRoleToUser = async (userId: string, groupId: string, roleId: string, requesterId: string) => {
    // Verificar se o solicitante é o dono do grupo
    const group = await db.query.groups.findFirst({
        where: eq(groups.id, groupId),
    });

    if (!group || group.group_owner !== requesterId) {
        throw new Error('Você não tem permissão para atribuir cargos neste grupo.');
    }

    // Verificar se o usuário é membro do grupo
    const userInGroup = await db.query.user_groups.findFirst({
        where: and(
            eq(user_groups.user_id, userId),
            eq(user_groups.group_id, groupId)
        ),
    });

    if (!userInGroup) {
        throw new Error('Usuário não é membro deste grupo.');
    }

    // Verificar se o role existe e pertence ao grupo
    const role = await db.query.groupRoles.findFirst({
        where: eq(groupRoles.id, roleId),
    });

    if (!role || role.group_id !== groupId) {
        throw new Error('Cargo não encontrado neste grupo.');
    }

    // Verificar se o usuário já tem este role
    const existingUserRole = await db.query.user_groups_roles.findFirst({
        where: and(
            eq(user_groups_roles.user_id, userId),
            eq(user_groups_roles.group_id, groupId),
            eq(user_groups_roles.role_id, roleId)
        ),
    });

    if (existingUserRole) {
        throw new Error('Usuário já possui este cargo.');
    }

    const [userRole] = await db.insert(user_groups_roles).values({
        user_id: userId,
        group_id: groupId,
        role_id: roleId,
    }).returning();

    return userRole;
};

export const removeRoleFromUser = async (userId: string, groupId: string, roleId: string, requesterId: string) => {
    const group = await db.query.groups.findFirst({
        where: eq(groups.id, groupId),
    });

    if (!group || group.group_owner !== requesterId) {
        throw new Error('Você não tem permissão para remover cargos neste grupo.');
    }

    await db.delete(user_groups_roles).where(
        and(
            eq(user_groups_roles.user_id, userId),
            eq(user_groups_roles.group_id, groupId),
            eq(user_groups_roles.role_id, roleId)
        )
    );

    return { message: 'Cargo removido do usuário com sucesso.' };
};

export const getUserGroupRoles = async (userId: string, groupId: string) => {
    return await db.query.user_groups_roles.findMany({
        where: and(
            eq(user_groups_roles.user_id, userId),
            eq(user_groups_roles.group_id, groupId)
        ),
    });
};
