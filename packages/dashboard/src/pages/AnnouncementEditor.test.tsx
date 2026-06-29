import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../api/client", () => ({
  api: {
    login: vi.fn(),
    me: vi.fn().mockResolvedValue({ username: "admin" }),
    listAnnouncements: vi.fn().mockResolvedValue({ announcements: [] }),
    createAnnouncement: vi.fn().mockResolvedValue({ announcement: { id: "new1", title: "Test", body: "Test body", tag: "New Feature", status: "published", published_at: "2026-01-01T00:00:00.000Z" } }),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    logout: vi.fn(),
    dailyAnalytics: vi.fn().mockResolvedValue({ daily: [] })
  }
}));

import { api } from "../api/client";
import { AnnouncementEditor } from "./AnnouncementEditor";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AnnouncementEditor", () => {
  it("creates and publishes a new announcement", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/new"]}>
        <Routes>
          <Route path="/new" element={<AnnouncementEditor mode="new" />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/dark mode is here/i), "New release v2.0");
    await user.type(screen.getByPlaceholderText(/describe what changed/i), "We shipped a major update with new features.");

    await user.click(screen.getByRole("button", { name: /^publish$/i }));

    await waitFor(() => {
      expect(api.createAnnouncement).toHaveBeenCalledTimes(1);
    });

    const call = vi.mocked(api.createAnnouncement).mock.calls[0][0];
    expect(call.title).toBe("New release v2.0");
    expect(call.body).toBe("We shipped a major update with new features.");
    expect(call.status).toBe("published");
  });
});
