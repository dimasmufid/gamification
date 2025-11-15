const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

let activeTenantId: string | null = null;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  tenantId?: string | null;
};

export function setActiveTenantId(tenantId: string | null) {
  activeTenantId = tenantId;
}

export function getActiveTenantId() {
  return activeTenantId;
}

export async function apiFetch<TResponse>(path: string, options: ApiRequestOptions = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const { body, headers, tenantId, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    credentials: "include",
    cache: "no-store",
  };

  const headerBag = new Headers(headers ?? undefined);
  headerBag.set("Content-Type", "application/json");
  const tenantHeader = tenantId ?? activeTenantId;
  if (tenantHeader) {
    headerBag.set("X-Tenant-Id", tenantHeader);
  }
  init.headers = headerBag;

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new ApiError(response.status, payload.detail ?? "Unexpected API error");
  }

  if (response.status === 204) {
    return null as TResponse;
  }

  return (await response.json()) as TResponse;
}
