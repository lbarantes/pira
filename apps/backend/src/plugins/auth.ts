import Elysia from "elysia"

export const authPlugin = (options?: any) => {
    return (app: Elysia) => {
        const authGuard = async ({ request, status, jwt, store }: any) => {
            const authorization = request.headers.get('authorization');

            if (!authorization || !authorization.startsWith('Bearer ')) {
                return status(401);
            }

            const token = authorization.split(' ')[1];
            try {
                const user = await jwt.verify(token);
                if (!user) return status(401);

                // Armazenar userId no store para uso nas rotas
                (store as any).userId = user.sub || null;

                if (options?.role && !options.role.includes(user.role))
                    return status(403)
            } catch {
                return status(401);
            }
        }

        app.onBeforeHandle(authGuard);
        return app;
    }
}