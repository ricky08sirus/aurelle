export const endpoints = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  me: "/api/auth/me",
};

/** Turns a FastAPI error response into one readable sentence. */
export async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]) {
      const first = data.detail[0];
      const msg = String(first.msg ?? "").replace(/^Value error, /, "");
      const field = Array.isArray(first.loc) ? first.loc.filter((p: unknown) => p !== "body").join(" → ") : "";
      return field ? `${field}: ${msg}` : msg;
    }
  } catch {}
  return "Something went wrong. Please try again.";
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) throw new Error(await readError(res));
  if (res.status === 204) return null as T;
  return res.json();
}