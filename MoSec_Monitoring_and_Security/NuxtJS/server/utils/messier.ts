const MESSIER_LOGIN_URL = 'https://bluejack.binus.ac.id/lapi/API/Account/LogOn';

export function extractToken(result: unknown): string | null {
    if (typeof result === 'string') return result;
    if (result && typeof result === 'object') {
        const r = result as Record<string, unknown>;
        for (const key of ['token', 'Token', 'accessToken', 'access_token', 'AccessToken', 'jwt', 'Jwt']) {
            const v = r[key];
            if (typeof v === 'string' && v.length > 0) return v;
        }
        for (const nestedKey of ['data', 'Data', 'user', 'User', 'result', 'Result']) {
            const nested = r[nestedKey];
            if (nested && typeof nested === 'object') {
                const found = extractToken(nested);
                if (found) return found;
            }
        }
    }
    return null;
}

export async function loginToMessier(username: string, password: string) {
    const response = await fetch(MESSIER_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result?.message || 'Messier login gagal');
    }

    const token = extractToken(result);
    if (!token) {
        throw new Error('Token tidak ditemukan dalam respons Messier');
    }

    return { token, raw: result };
}
