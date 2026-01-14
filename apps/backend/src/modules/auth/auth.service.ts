import { redis } from "bun";
import { eq } from "drizzle-orm";
import { CompleteRegistration, LoginUser } from "shared-types";
import { db } from "src/db";
import { users } from "src/db/schema";
import { redisClient } from "src/lib/redis";

const VERIFICATION_CODE_EXPIRATION_SECONDS = 300;

export const sendVerificationCode = async (email: string) => {
    const allowedEmails = ['@liderbpo.com.br', '@petrobras.com.br'];

    const isEmailAllowed = allowedEmails.some(domain => email.endsWith(domain));

    if (!isEmailAllowed) {
        throw new Error('Esse e-mail não é permitdo em nosso sistema!');
    }
    
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
    })

    if (existingUser) {
        throw new Error('Este e-mail já está sendo utilizado!');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `verify-code:${email}`;

    console.log(code)

    await redisClient.set(redisKey, code, 'EX', VERIFICATION_CODE_EXPIRATION_SECONDS)
    
    return { message: `Código de verificação enviado para ${email}.` };
}

export const verifyCode = async (email: string, code: string) => {
    const redisKey = `verify-code:${email}`;
    const storedCode = await redisClient.get(redisKey);
    
    if (!storedCode || storedCode !== code) {
        throw new Error('Código expirado ou inválido. Por favor, tente novamente.');
    }

    await redisClient.del(redisKey);

    return { email: email, verified: true }
}

export const completeRegistration = async (userData: { email: string; username: string; password: string; }) => {
    const passwordHash = await Bun.password.hash(userData.password, {
        algorithm: "bcrypt",
        cost: 10
    });

    const [newUser] = await db.insert(users).values({
        email: userData.email,
        username: userData.username,
        passwordHash: passwordHash,
    }).returning({
        id: users.id,
        email: users.email,
        username: users.username
    })

    return newUser;
}

export const login = async (credentials: LoginUser) => {
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, credentials.email)
    })

    if (!existingUser) {
        throw new Error('Email ou senha incorretas.');
    }

    const isPasswordCorrect = await Bun.password.verify(
        credentials.password,
        existingUser.passwordHash
    )

    if (!isPasswordCorrect) {
        throw new Error('Email ou senha incorretas.');
    }

    return {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username
    };

}