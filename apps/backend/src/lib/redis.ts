import { RedisClient } from "bun";

const REDIS_URL = Bun.env.REDIS_URL;

if (!REDIS_URL) {
	console.error('[redis] REDIS_URL is not set in environment');
}

const createClient = () => {
	try {
		const client = new RedisClient(REDIS_URL as string);

		return client;
	} catch (err) {
		console.error('[redis] Error creating RedisClient:', err);
		throw err;
	}
};

export const redisClient = createClient();