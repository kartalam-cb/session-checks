import {base64url, calculateJwkThumbprint, EncryptJWT, jwtDecrypt} from "jose"
import hkdf from "@panva/hkdf"
import {COOKIE_AUTH_JS_SESSION_TOKEN, sessionMaxAge} from "@/config/helpers";
import {JWT} from "next-auth/jwt";

const now = () => (Date.now() / 1000) | 0

type Digest = Parameters<typeof calculateJwkThumbprint>[1]

export interface JWTEncodeParams {
    /** The JWT payload. */
    token: JWT
    /**
     * Used in combination with `secret` when deriving the encryption secret for the various NextAuth.js-issued JWTs.
     * @note When no `salt` is passed, we assume this is a session token.
     * This is for backwards-compatibility with currently active sessions, so they won't be invalidated when upgrading the package.
     */
    salt: string
    /** The key material used to encode the NextAuth.js issued JWTs. Defaults to `NEXTAUTH_SECRET`. */
    secret: string | string[]
    /**
     * The maximum age of the NextAuth.js issued JWT in seconds.
     * @default 30 * 24 * 60 * 60 // 30 days
     */
    maxAge?: number
}

export interface JWTDecodeParams {
    /** The NextAuth.js issued JWT to be decoded */
    token?: string
    /**
     * Used in combination with `secret` when deriving the encryption secret for the various NextAuth.js-issued JWTs.
     * @note When no `salt` is passed, we assume this is a session token.
     * This is for backwards-compatibility with currently active sessions, so they won't be invalidated when upgrading the package.
     */
    salt: string | string[]
    /** The key material used to decode the NextAuth.js issued JWTs. Defaults to `NEXTAUTH_SECRET`. */
    secret: string | Buffer
}

const encryption = "A256CBC-HS512"
const algorithm = "dir"

export async function encode(params: JWTEncodeParams) {
    const {token = {}, secret, maxAge = sessionMaxAge} = params
    const secrets = Array.isArray(secret) ? secret : [secret]
    const encryptionSecret = await getDerivedEncryptionKey(secrets[0], COOKIE_AUTH_JS_SESSION_TOKEN)

    const thumbprint = await calculateJwkThumbprint(
        {kty: "oct", k: base64url.encode(encryptionSecret)},
        `sha${encryptionSecret.byteLength << 3}` as Digest
    )
    return await new EncryptJWT(token)
        .setProtectedHeader({alg: algorithm, enc: encryption, kid: thumbprint})
        .setIssuedAt()
        .setExpirationTime(now() + maxAge)
        .setJti(crypto.randomUUID())
        .encrypt(encryptionSecret)
}

export async function decode(
    params: JWTDecodeParams
): Promise<JWT | null> {
    const {token, secret} = params
    const secrets = Array.isArray(secret) ? secret : [secret]
    if (!token) return null

    const encryptionSecret = await getDerivedEncryptionKey(
        secrets[0],
        COOKIE_AUTH_JS_SESSION_TOKEN
    )

    const {payload} = await jwtDecrypt(
        token,
        encryptionSecret,
        {
            clockTolerance: 15,
            keyManagementAlgorithms: [algorithm],
            contentEncryptionAlgorithms: [encryption, "A256GCM"],
        }
    )
    return payload
}

async function getDerivedEncryptionKey(
    keyMaterial: string | Buffer,
    salt: string,
) {
    return await hkdf(
        "sha256",
        keyMaterial,
        salt,
        `CB Generated Encryption Key${salt ? ` (${salt})` : ""}`,
        64
    )
}
