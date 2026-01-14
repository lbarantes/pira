import { db } from 'src/db';
import { groupInvites, groups } from 'src/db/schema/groups';
import { eq, and, gt, lte } from 'drizzle-orm';
import { CreateGroupInvite } from 'shared-types';

// Mapa de expiração em minutos
const EXPIRATION_MINUTES = {
    '30_minutes': 30,
    '1_hour': 60,
    '6_hours': 360,
    '12_hours': 720,
    '1_day': 1440,
    '7_days': 10080,
};

// Mapa de usos máximos
const MAX_USES = {
    'unlimited': null,
    '1_use': 1,
    '5_uses': 5,
    '10_uses': 10,
    '25_uses': 25,
    '50_uses': 50,
    '100_uses': 100,
};

// Gera um token aleatório único para o convite
function generateInviteToken(): string {
    return `invite_${crypto.randomUUID().slice(0, 12)}_${Date.now()}`;
}

/**
 * Cria um novo link de convite para um grupo
 */
export async function createGroupInvite(
    groupId: string,
    createdBy: string,
    config: CreateGroupInvite
): Promise<{ token: string; link: string }> {
    try {
        // Verifica se o usuário é dono do grupo
        const group = await db.query.groups.findFirst({
            where: eq(groups.id, groupId),
        });

        if (!group) {
            throw new Error('Grupo não encontrado');
        }

        if (group.group_owner !== createdBy) {
            throw new Error('Apenas o dono do grupo pode criar convites');
        }

        // Calcula data de expiração
        const now = new Date();
        const minutesToAdd = EXPIRATION_MINUTES[config.expiration_type];
        const expiresAt = new Date(now.getTime() + minutesToAdd * 60 * 1000);

        // Gera token único
        const token = generateInviteToken();

        // Obtém número máximo de usos
        const maxUses = MAX_USES[config.uses_type];

        // Cria o convite no banco de dados
        const invite = await db.insert(groupInvites).values({
            group_id: groupId,
            created_by: createdBy,
            token,
            expires_at: expiresAt,
            expiration_type: config.expiration_type,
            max_uses: maxUses,
            uses_type: config.uses_type,
            is_active: 1,
        }).returning();

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const link = `${baseUrl}/join/${token}`;

        return {
            token,
            link,
        };
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Erro ao criar convite'
        );
    }
}

/**
 * Valida um token de convite e retorna informações sobre ele
 */
export async function validateInviteToken(token: string) {
    try {
        const invite = await db.query.groupInvites.findFirst({
            where: eq(groupInvites.token, token),
            with: {
                group: {
                    columns: {
                        id: true,
                        group_name: true,
                        group_description: true,
                        group_avatar: true,
                    },
                },
            },
        });

        if (!invite) {
            throw new Error('Link de convite inválido ou expirado');
        }

        // Verifica se está ativo
        if (invite.is_active === 0) {
            throw new Error('Link de convite foi desativado');
        }

        // Verifica se expirou
        const now = new Date();
        if (now > invite.expires_at) {
            throw new Error('Link de convite expirou');
        }

        // Verifica se atingiu o limite de usos
        if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) {
            throw new Error('Link de convite já atingiu o limite de usos');
        }

        return {
            valid: true,
            invite: {
                id: invite.id,
                group_id: invite.group_id,
                group: invite.group,
                expires_at: invite.expires_at,
                uses_count: invite.uses_count,
                max_uses: invite.max_uses,
            },
        };
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Erro ao validar convite'
        );
    }
}

/**
 * Usa um convite (incrementa o contador de usos)
 */
export async function useInviteToken(token: string): Promise<string> {
    try {
        const invite = await db.query.groupInvites.findFirst({
            where: eq(groupInvites.token, token),
        });

        if (!invite) {
            throw new Error('Link de convite inválido');
        }

        // Verifica se pode usar
        if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) {
            throw new Error('Link de convite já atingiu o limite de usos');
        }

        // Incrementa contador
        const updated = await db
            .update(groupInvites)
            .set({ uses_count: invite.uses_count + 1 })
            .where(eq(groupInvites.id, invite.id))
            .returning();

        return invite.group_id;
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Erro ao usar convite'
        );
    }
}

/**
 * Lista todos os convites de um grupo
 */
export async function listGroupInvites(groupId: string, userId: string) {
    try {
        // Verifica permissão
        const group = await db.query.groups.findFirst({
            where: eq(groups.id, groupId),
        });

        if (!group) {
            throw new Error('Grupo não encontrado');
        }

        if (group.group_owner !== userId) {
            throw new Error('Apenas o dono do grupo pode visualizar convites');
        }

        const invites = await db.query.groupInvites.findMany({
            where: eq(groupInvites.group_id, groupId),
            orderBy: (invites: any) => invites.created_at,
        });

        return invites.map((invite: any) => ({
            ...invite,
            is_expired: new Date() > invite.expires_at,
            is_exhausted: invite.max_uses !== null && invite.uses_count >= invite.max_uses,
        }));
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Erro ao listar convites'
        );
    }
}

/**
 * Desativa um convite
 */
export async function deactivateInvite(inviteId: string, userId: string) {
    try {
        const invite = await db.query.groupInvites.findFirst({
            where: eq(groupInvites.id, inviteId),
        });

        if (!invite) {
            throw new Error('Convite não encontrado');
        }

        // Verifica permissão
        const group = await db.query.groups.findFirst({
            where: eq(groups.id, invite.group_id),
        });

        if (group?.group_owner !== userId) {
            throw new Error('Apenas o dono do grupo pode desativar convites');
        }

        await db
            .update(groupInvites)
            .set({ is_active: 0 })
            .where(eq(groupInvites.id, inviteId));

        return { message: 'Convite desativado com sucesso' };
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Erro ao desativar convite'
        );
    }
}

/**
 * Ativa um convite novamente
 */
export async function reactivateInvite(inviteId: string, userId: string) {
    try {
        const invite = await db.query.groupInvites.findFirst({
            where: eq(groupInvites.id, inviteId),
        });

        if (!invite) {
            throw new Error('Convite não encontrado');
        }

        // Verifica permissão
        const group = await db.query.groups.findFirst({
            where: eq(groups.id, invite.group_id),
        });

        if (group?.group_owner !== userId) {
            throw new Error('Apenas o dono do grupo pode ativar convites');
        }

        await db
            .update(groupInvites)
            .set({ is_active: 1 })
            .where(eq(groupInvites.id, inviteId));

        return { message: 'Convite ativado com sucesso' };
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Erro ao ativar convite'
        );
    }
}

/**
 * Deleta um convite
 */
export async function deleteInvite(inviteId: string, userId: string) {
    try {
        const invite = await db.query.groupInvites.findFirst({
            where: eq(groupInvites.id, inviteId),
        });

        if (!invite) {
            throw new Error('Convite não encontrado');
        }

        // Verifica permissão
        const group = await db.query.groups.findFirst({
            where: eq(groups.id, invite.group_id),
        });

        if (group?.group_owner !== userId) {
            throw new Error('Apenas o dono do grupo pode deletar convites');
        }

        await db.delete(groupInvites).where(eq(groupInvites.id, inviteId));

        return { message: 'Convite deletado com sucesso' };
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Erro ao deletar convite'
        );
    }
}
