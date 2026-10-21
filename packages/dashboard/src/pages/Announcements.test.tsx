import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { api } from "../api/client";
import { Announcements } from "./Announcements";

vi.mock("../api/client", () => ({
  api: { listAnnouncements: vi.fn(), dailyAnalytics: vi.fn(), updateAnnouncement: vi.fn(), deleteAnnouncement: vi.fn(), bulkDelete: vi.fn(), clearAnalytics: vi.fn() },
  isUnauthorized: () => false
}));
const items = [
  { id: "live", title: "Faster search", body: "Search every project", tag: "New Feature", status: "published", published_at: "2026-10-19T10:00:00Z", created_at: "2026-10-18T10:00:00Z", updated_at: "2026-10-19T10:00:00Z", analytics: { views: 12, clicks: 3, ctr: 25 } },
  { id: "draft", title: "Better exports", body: "Share a report", tag: null, status: "draft", published_at: null, created_at: "2026-10-19T10:00:00Z", updated_at: "2026-10-19T10:00:00Z", analytics: { views: 0, clicks: 0, ctr: 0 } }
] as const;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listAnnouncements).mockResolvedValue({ announcements: structuredClone(items) as unknown as Awaited<ReturnType<typeof api.listAnnouncements>>["announcements"] });
  vi.mocked(api.dailyAnalytics).mockResolvedValue({ daily: [{ date: "2026-10-19", views: 4, clicks: 2 }] });
});
const renderPage = () => render(<MemoryRouter><Announcements /></MemoryRouter>);
describe("Publishing workspace", () => {
  it("gives the empty workspace a real announcements navigation target", async () => {
    vi.mocked(api.listAnnouncements).mockResolvedValue({ announcements: [] });
    const { container } = renderPage();
    expect(await screen.findByRole("heading", { name: "What should your users know?" })).toBeInTheDocument();
    expect(container.querySelector("#announcements")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /embed code/i })).toHaveAttribute("href", "/install");
  });

  it("keeps announcements usable when daily analytics is unavailable", async () => {
    vi.mocked(api.dailyAnalytics).mockRejectedValue(new Error("Unavailable"));
    renderPage();
    expect(await screen.findByText("Reader activity couldn't load.")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Faster search")).toBeInTheDocument();
    expect(screen.queryByText("Your next reader starts the story.")).not.toBeInTheDocument();
  });
  it("clears hidden selections when changing status filters", async () => {
    const user = userEvent.setup(); renderPage();
    await user.click(await screen.findByLabelText("Select Faster search"));
    expect(screen.getByRole("button", { name: "Delete selected" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Drafts", exact: true }));
    expect(screen.queryByRole("button", { name: "Delete selected" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Select Faster search")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Select Better exports")).toBeInTheDocument();
  });
  it("clears selections when search changes", async () => {
    const user = userEvent.setup(); renderPage();
    await user.click(await screen.findByLabelText("Select Faster search"));
    await user.type(screen.getByRole("textbox", { name: "Search announcements" }), "exports");
    expect(screen.queryByRole("button", { name: "Delete selected" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Select Faster search")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Select Better exports")).toBeInTheDocument();
  });
  it("reports a failed publishing action without losing the announcement", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateAnnouncement).mockRejectedValue(new Error("Could not publish. Try again."));
    renderPage();
    await user.click(await screen.findByLabelText("Actions for Better exports"));
    await user.click(screen.getByRole("button", { name: "Publish", exact: true }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Could not publish"));
    expect(screen.getByLabelText("Select Better exports")).toBeInTheDocument();
  });
});
