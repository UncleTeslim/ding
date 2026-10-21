import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { WidgetSetup } from "./WidgetSetup";

function renderPage() {
  return render(<MemoryRouter><WidgetSetup /></MemoryRouter>);
}

describe("Widget setup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("generates a local embed snippet for the selected display and position", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(screen.getByLabelText("Ding instance URL"));
    await user.type(screen.getByLabelText("Ding instance URL"), "https://ding.example.test/base/path");
    await user.selectOptions(screen.getByLabelText("Display mode"), "both");
    await user.selectOptions(screen.getByLabelText("Position"), "bottom-left");

    const snippet = document.querySelector(".embed-code")?.textContent;
    expect(snippet).toContain('src="https://ding.example.test/widget.js"');
    expect(snippet).toContain('data-trigger="both"');
    expect(snippet).toContain('data-position="bottom-left"');
    expect(screen.getByLabelText("Ding instance URL")).toHaveValue("https://ding.example.test/base/path");
  });

  it("blocks invalid URLs and explains that code is generated locally", async () => {
    const user = userEvent.setup();
    renderPage();
    const input = screen.getByLabelText("Ding instance URL");
    await user.clear(input);
    await user.type(input, "javascript:alert(1)");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/Enter a valid HTTP or HTTPS instance URL/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy code" })).toBeDisabled();
    expect(screen.getByText(/creates the snippet in your browser/i)).toBeInTheDocument();
  });

  it("reports clipboard success and provides a manual-copy fallback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    renderPage();
    await user.clear(screen.getByLabelText("Ding instance URL"));
    await user.type(screen.getByLabelText("Ding instance URL"), "https://ding.example.test");

    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/widget.js"));
    expect(screen.getByRole("status")).toHaveTextContent("Embed code copied.");

    writeText.mockRejectedValueOnce(new Error("Clipboard blocked"));
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(screen.getByRole("status")).toHaveTextContent(/copy it manually/i);
  });
});
