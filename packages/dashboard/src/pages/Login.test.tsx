import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../api/client", () => ({
  api: {
    login: vi.fn().mockResolvedValue({ ok: true }),
    me: vi.fn().mockResolvedValue({ username: "admin" }),
    listAnnouncements: vi.fn().mockResolvedValue({ announcements: [] }),
    createAnnouncement: vi.fn().mockResolvedValue({ announcement: { id: "new1" } }),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    logout: vi.fn(),
    dailyAnalytics: vi.fn().mockResolvedValue({ daily: [] })
  }
}));

import { api } from "../api/client";
import { Login } from "./Login";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Login page", () => {
  it("submits credentials and navigates on success", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(api.login).toHaveBeenCalledWith("admin", "password");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows error on failed login", async () => {
    vi.mocked(api.login).mockRejectedValueOnce(new Error("Invalid credentials"));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });
});
