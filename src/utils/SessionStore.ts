const ALLOWED_COOKIE_SIZE = 4096;
// Based on commented out section above
const ESTIMATED_EMPTY_COOKIE_SIZE = 163;
const CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE;

interface CookieSerializeOptions {
  domain?: string;
  encode?: (str: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  partitioned?: boolean;
  path?: string;
  priority?: "high" | "low" | "medium";
  sameSite?: boolean | "none" | "strict" | "lax";
  secure?: boolean;
}

interface CookieOption {
  name: string;
  options: CookieSerializeOptions;
}

interface Cookie extends CookieOption {
  value: string;
}

type Chunks = Record<string, string>;

export class SessionStore {
  #chunks: Chunks = {};
  #option: CookieOption;

  constructor(option: CookieOption, cookies: Record<string, string>) {
    this.#option = option;

    const { name: cookieName } = option;

    // Load base cookie and any chunked variants `${name}.<n>` in any order.
    // We don't assume contiguous indices; we collect all matching keys and sort by numeric suffix.
    const prefix = `${cookieName}`;
    const matchingKeys = Object.keys(cookies).filter((key) =>
      key === prefix || key.startsWith(`${prefix}.`)
    );

    const keyed: Array<{ key: string; index: number; value: string }> = [];
    for (const key of matchingKeys) {
      const value = cookies[key];
      if (typeof value !== "string" || value.length === 0) continue;

      // Extract numeric suffix, if present
      const parts = key.split(".");
      const suffix = parts.length > 1 ? parseInt(parts[parts.length - 1] || "", 10) : -1;
      const index = Number.isFinite(suffix) ? suffix : -1;
      keyed.push({ key, index, value });
    }

    // Sort: base cookie first (index -1), then ascending numeric indices
    keyed.sort((a, b) => a.index - b.index);
    for (const { key, value } of keyed) {
      this.#chunks[key] = value;
    }
  }

  /**
   * The JWT Session or database Session ID
   * constructed from the cookie chunks.
   */
  get value() {
    // Sort the chunks by their keys before joining
    const sortedKeys = Object.keys(this.#chunks).sort((a, b) => {
      const aParts = a.split(".");
      const bParts = b.split(".");
      const aHasIndex = aParts.length > 1;
      const bHasIndex = bParts.length > 1;
      if (!aHasIndex && bHasIndex) return -1; // base first
      if (aHasIndex && !bHasIndex) return 1;
      const aSuffix = parseInt(aParts[aParts.length - 1] ?? "0", 10);
      const bSuffix = parseInt(bParts[bParts.length - 1] ?? "0", 10);
      return (Number.isFinite(aSuffix) ? aSuffix : -1) - (Number.isFinite(bSuffix) ? bSuffix : -1);
    });

    // Use the sorted keys to join the chunks in the correct order
    return sortedKeys.map((key) => this.#chunks[key]).join("");
  }

  /** Given a cookie, return a list of cookies, chunked to fit the allowed cookie size. */
  #chunk(cookie: Cookie): Cookie[] {
    const chunkCount = Math.ceil(cookie.value.length / CHUNK_SIZE);

    if (chunkCount === 1) {
      this.#chunks[cookie.name] = cookie.value;
      return [cookie];
    }

    const cookies: Cookie[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const name = `${cookie.name}.${i}`;
      const value = cookie.value.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE);
      cookies.push({ ...cookie, name, value });
      this.#chunks[name] = value;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("CHUNKING_SESSION_COOKIE", {
        message: `Session cookie exceeds allowed ${ALLOWED_COOKIE_SIZE} bytes.`,
        emptyCookieSize: ESTIMATED_EMPTY_COOKIE_SIZE,
        valueSize: cookie.value.length,
        chunks: cookies.map((c) => c.value.length + ESTIMATED_EMPTY_COOKIE_SIZE),
      });
    }

    return cookies;
  }

  /** Returns cleaned cookie chunks. */
  #clean(): Record<string, Cookie> {
    const cleanedChunks: Record<string, Cookie> = {};
    for (const name in this.#chunks) {
      delete this.#chunks?.[name];
      cleanedChunks[name] = {
        name,
        value: "",
        options: { ...this.#option.options, maxAge: 0 },
      };
    }
    return cleanedChunks;
  }

  /**
   * Given a cookie value, return new cookies, chunked, to fit the allowed cookie size.
   * If the cookie has changed from chunked to unchunked or vice versa,
   * it deletes the old cookies as well.
   */
  chunk(value: string, options: Partial<Cookie["options"]>): Cookie[] {
    // Assume all cookies should be cleaned by default
    const cookies: Record<string, Cookie> = this.#clean();

    // Calculate new chunks
    const chunked = this.#chunk({
      name: this.#option.name,
      value,
      options: { ...this.#option.options, ...options },
    });

    // Update stored chunks / cookies
    for (const chunk of chunked) {
      cookies[chunk.name] = chunk;
    }

    return Object.values(cookies);
  }

  /** Returns a list of cookies that should be cleaned. */
  clean(): Cookie[] {
    return Object.values(this.#clean());
  }

  /** Returns the names of the currently tracked cookie chunks (for diagnostics). */
  getChunkNames(): string[] {
    return Object.keys(this.#chunks).slice().sort();
  }
}
