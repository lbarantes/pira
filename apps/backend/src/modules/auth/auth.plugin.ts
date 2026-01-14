import Elysia from "elysia";
import jwt from "@elysiajs/jwt";
import * as authService from "./auth.service";
import { CompleteRegistrationSchema, LoginUserSchema, SendVerificationCodeSchema, VerifyCodeSchema } from "shared-types";

if (!Bun.env.JWT_SECRET) {
    throw new Error('JWT Secret not defined on .env')
}

const JWT_SECRET = Bun.env.JWT_SECRET

export const authCore = new Elysia({ name: 'auth.core' })
    .use(
        jwt({
            name: 'jwt',
            secret: JWT_SECRET
        })
    );

export const authRoutes = new Elysia({
    prefix: '/auth'
})
    .use(authCore)
    .group('/register', (app) =>
        app
        .post(
            '/send-code',
            async ({ body }) => {
                return await authService.sendVerificationCode(body.email);
            },
            {
                body: SendVerificationCodeSchema
            }
        )
        .post(
            '/verify-code',
            async ({ body, jwt }) => {
                const result = await authService.verifyCode(body.email, body.code);

                const verificationToken = await jwt.sign({
                    sub: result.email,
                    scope: 'register-verification',
                    exp: '10m'
                });

                return verificationToken
            },
            {
                body: VerifyCodeSchema
            }
        )
        .post(
            '/complete',
            async ({ body, headers, jwt, set }) => {
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    set.status = 401;
                    return { message: 'Token de verificação não fornecido.' };
                }

                const token = authHeader.substring(7);
                const payload = await jwt.verify(token);

                if (!payload || !payload.sub || payload.scope !== 'register-verification') {
                    set.status = 401;
                    return { message: 'Token de verificação inválido.' };
                }

                const newUser = await authService.completeRegistration({
                    email: payload.sub as string,
                    username: body.username,
                    password: body.password
                });

                set.status = 201;
                return newUser;
            },
            {
                body: CompleteRegistrationSchema
            }
        )
    )
    .post(
        '/login',
        async ({ body, jwt }) => {
            const user = await authService.login(body);

            const token = await jwt.sign({
                sub: user.id,
                email: user.email,
                scope: 'login',
                exp: "7d"
            });

            return {
                data: {
                    user,
                    token
                }
            };
        },
        {
            body: LoginUserSchema
        }
    )
