import {CookieOption} from "next-auth";

const ALLOWED_COOKIE_SIZE = 4096
// Based on commented out section above
const ESTIMATED_EMPTY_COOKIE_SIZE = 163
const CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE

interface Cookie extends CookieOption {
    name: string;
    value: string;
}

type Chunks = Record<string, string>

export class SessionStore {
    #chunks: Chunks = {}
    #option: CookieOption

    constructor(
        option: CookieOption,
        cookies: Record<string, string>,
    ) {
        this.#option = option

        const { name: cookieName } = option

        // Load base cookie and any chunked variants `${name}.0`, `${name}.1`, ... if present
        const baseValue = cookies[cookieName]
        if (typeof baseValue === "string" && baseValue.length > 0) {
            this.#chunks[cookieName] = baseValue
        }

        // Collect chunked parts in order if any exist
        let index = 0
        // Limit to a sane maximum to avoid infinite loops on malformed inputs
        const MAX_CHUNKS = 50
        while (index < MAX_CHUNKS) {
            const chunkName = `${cookieName}.${index}`
            const value = cookies[chunkName]
            if (typeof value !== "string" || value.length === 0) break
            this.#chunks[chunkName] = value
            index++
        }
    }

    /**
     * The JWT Session or database Session ID
     * constructed from the cookie chunks.
     */
    get value() {
        // Sort the chunks by their keys before joining
        const sortedKeys = Object.keys(this.#chunks).sort((a, b) => {
            const aSuffix = parseInt(a.split(".").pop() ?? "0")
            const bSuffix = parseInt(b.split(".").pop() ?? "0")

            return aSuffix - bSuffix
        })

        // Use the sorted keys to join the chunks in the correct order
        return sortedKeys.map((key) => this.#chunks[key]).join("")
    }

    /** Given a cookie, return a list of cookies, chunked to fit the allowed cookie size. */
    #chunk(cookie: Cookie): Cookie[] {
        const chunkCount = Math.ceil(cookie.value.length / CHUNK_SIZE)

        if (chunkCount === 1) {
            this.#chunks[cookie.name] = cookie.value
            return [cookie]
        }

        const cookies: Cookie[] = []
        for (let i = 0; i < chunkCount; i++) {
            const name = `${cookie.name}.${i}`
            const value = cookie.value.substr(i * CHUNK_SIZE, CHUNK_SIZE)
            cookies.push({ ...cookie, name, value })
            this.#chunks[name] = value
        }

        console.log("CHUNKING_SESSION_COOKIE", {
            message: `Session cookie exceeds allowed ${ALLOWED_COOKIE_SIZE} bytes.`,
            emptyCookieSize: ESTIMATED_EMPTY_COOKIE_SIZE,
            valueSize: cookie.value.length,
            chunks: cookies.map((c) => c.value.length + ESTIMATED_EMPTY_COOKIE_SIZE),
        })

        return cookies
    }

    /** Returns cleaned cookie chunks. */
    #clean(): Record<string, Cookie> {
        const cleanedChunks: Record<string, Cookie> = {}
        for (const name in this.#chunks) {
            delete this.#chunks?.[name]
            cleanedChunks[name] = {
                name,
                value: "",
                options: { ...this.#option.options, maxAge: 0 },
            }
        }
        return cleanedChunks
    }

    /**
     * Given a cookie value, return new cookies, chunked, to fit the allowed cookie size.
     * If the cookie has changed from chunked to unchunked or vice versa,
     * it deletes the old cookies as well.
     */
    chunk(value: string, options: Partial<Cookie["options"]>): Cookie[] {
        // Assume all cookies should be cleaned by default
        const cookies: Record<string, Cookie> = this.#clean()

        // Calculate new chunks
        const chunked = this.#chunk({
            name: this.#option.name,
            value,
            options: { ...this.#option.options, ...options },
        })

        // Update stored chunks / cookies
        for (const chunk of chunked) {
            cookies[chunk.name] = chunk
        }

        return Object.values(cookies)
    }

    /** Returns a list of cookies that should be cleaned. */
    clean(): Cookie[] {
        return Object.values(this.#clean())
    }
}