import Elysia from "elysia";
import * as channelsService from "./channels.service";
import { CreateChannelSchema, UpdateChannelSchema } from "shared-types";

export const channelRoutes = new Elysia({
    prefix: '/groups/:groupId/channels'
})
    .post(
        '/',
        async ({ params, body, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const channel = await channelsService.createChannel(params.groupId, body, userId);
                set.status = 201;
                return channel;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao criar canal' };
            }
        },
        {
            body: CreateChannelSchema,
            as: 'json',
            detail: {
                tags: ['Channels'],
                summary: 'Criar novo canal',
                description: 'Cria um novo canal dentro de um grupo'
            }
        }
    )
    .get(
        '/',
        async ({ params, set }) => {
            try {
                const channels = await channelsService.getGroupChannels(params.groupId);
                return channels;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao buscar canais' };
            }
        },
        {
            detail: {
                tags: ['Channels'],
                summary: 'Listar canais do grupo',
                description: 'Retorna todos os canais pertencentes a um grupo'
            }
        }
    )
    .get(
        '/:channelId',
        async ({ params, set }) => {
            try {
                const channel = await channelsService.getChannelById(params.channelId);
                if (!channel) {
                    set.status = 404;
                    return { error: 'Canal não encontrado' };
                }
                return channel;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao buscar canal' };
            }
        },
        {
            detail: {
                tags: ['Channels'],
                summary: 'Buscar canal',
                description: 'Retorna os detalhes de um canal específico'
            }
        }
    )
    .put(
        '/:channelId',
        async ({ params, body, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const channel = await channelsService.updateChannel(params.channelId, body, userId);
                return channel;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao atualizar canal' };
            }
        },
        {
            body: UpdateChannelSchema,
            as: 'json',
            detail: {
                tags: ['Channels'],
                summary: 'Atualizar canal',
                description: 'Atualiza as informações de um canal'
            }
        }
    )
    .delete(
        '/:channelId',
        async ({ params, set, store }) => {
            try {
                const userId = (store as any).userId as string | null;
                if (!userId) {
                    set.status = 401;
                    return { error: 'Não autenticado' };
                }

                const result = await channelsService.deleteChannel(params.channelId, userId);
                return result;
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Erro ao deletar canal' };
            }
        },
        {
            detail: {
                tags: ['Channels'],
                summary: 'Deletar canal',
                description: 'Remove um canal do grupo'
            }
        }
    )
