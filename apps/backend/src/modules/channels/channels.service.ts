import { eq, and } from "drizzle-orm";
import { CreateChannel, UpdateChannel } from "shared-types";
import { db } from "src/db";
import { channels } from "src/db/schema/channels";
import { groups } from "src/db/schema/groups/groups";

// ===== CHANNELS =====
export const createChannel = async (groupId: string, data: CreateChannel, userId: string) => {
    // Verificar se o grupo existe e se o usuário é o dono
    const group = await db.query.groups.findFirst({
        where: eq(groups.id, groupId),
    });

    if (!group) {
        throw new Error('Grupo não encontrado.');
    }

    if (group.group_owner !== userId) {
        throw new Error('Você não tem permissão para criar canais neste grupo.');
    }

    const [newChannel] = await db.insert(channels).values({
        group_id: groupId,
        channel_name: data.channel_name,
        channel_description: data.channel_description,
        position: data.position || 0,
    }).returning();

    return newChannel;
};

export const getChannelById = async (channelId: string) => {
    return await db.query.channels.findFirst({
        where: eq(channels.id, channelId),
    });
};

export const getGroupChannels = async (groupId: string) => {
    return await db.query.channels.findMany({
        where: eq(channels.group_id, groupId),
        orderBy: (channels, { desc }) => desc(channels.position),
        columns: {
          id: true,
          channel_name: true,
          channel_description: true,
          position: true,
        }
    });
};

export const updateChannel = async (channelId: string, data: UpdateChannel, userId: string) => {
    const channel = await db.query.channels.findFirst({
        where: eq(channels.id, channelId),
    });

    if (!channel) {
        throw new Error('Canal não encontrado.');
    }

    const group = await db.query.groups.findFirst({
        where: eq(groups.id, channel.group_id),
    });

    if (!group || group.group_owner !== userId) {
        throw new Error('Você não tem permissão para atualizar este canal.');
    }

    const [updatedChannel] = await db.update(channels)
        .set({
            ...(data.channel_name && { channel_name: data.channel_name }),
            ...(data.channel_description && { channel_description: data.channel_description }),
            ...(data.position !== undefined && { position: data.position }),
            updated_at: new Date(),
        })
        .where(eq(channels.id, channelId))
        .returning();

    return updatedChannel;
};

export const deleteChannel = async (channelId: string, userId: string) => {
    const channel = await db.query.channels.findFirst({
        where: eq(channels.id, channelId),
    });

    if (!channel) {
        throw new Error('Canal não encontrado.');
    }

    const group = await db.query.groups.findFirst({
        where: eq(groups.id, channel.group_id),
    });

    if (!group || group.group_owner !== userId) {
        throw new Error('Você não tem permissão para deletar este canal.');
    }

    await db.delete(channels).where(eq(channels.id, channelId));
    return { message: 'Canal deletado com sucesso.' };
};
