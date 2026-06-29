import type { Announcement, AnnouncementPayload, DailyPoint } from "../types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    credentials: "include"
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ ok: true }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ username: string }>("/api/auth/me"),
  listAnnouncements: () => request<{ announcements: Announcement[] }>("/api/admin/announcements"),
  createAnnouncement: (payload: AnnouncementPayload) =>
    request<{ announcement: Announcement }>("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateAnnouncement: (id: string, payload: Partial<AnnouncementPayload>) =>
    request<{ announcement: Announcement }>(`/api/admin/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteAnnouncement: (id: string) =>
    request<void>(`/api/admin/announcements/${id}`, {
      method: "DELETE"
    }),
  dailyAnalytics: () => request<{ daily: DailyPoint[] }>("/api/admin/analytics/daily")
};
