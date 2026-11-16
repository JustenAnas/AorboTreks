import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("gsap", () => ({
  gsap: {
    registerPlugin: vi.fn(),
    context: vi.fn((callback: () => void) => {
      callback();
      return { revert: vi.fn() };
    }),
    ticker: { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() },
    utils: { toArray: vi.fn(() => []) },
    to: vi.fn(),
    from: vi.fn(),
    fromTo: vi.fn(),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: vi.fn(), update: vi.fn() },
}));

vi.mock("lenis", () => ({
  default: class {
    on() {}
    raf() {}
    destroy() {}
  },
}));

vi.mock("@/components/summit-sky", () => ({
  default: () => <div data-testid="summit-sky" />,
}));

import App from "@/App";

describe("App", () => {
  it("renders the home page content and summit scene", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /find your/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /every step/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /book your/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByLabelText("Search your trek")).toBeInTheDocument();
    expect(await screen.findByTestId("summit-sky")).toBeInTheDocument();
  });

  it("finds a trek and scrolls to its card", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<App />);

    fireEvent.change(screen.getByLabelText("Search your trek"), {
      target: { value: "kedar" },
    });

    const results = document.getElementById("trek-search-results");
    expect(results).not.toBeNull();

    const resultList = within(results as HTMLElement);
    expect(resultList.getByText("Kedarkantha")).toBeInTheDocument();
    expect(resultList.queryByText("Rupin Pass")).not.toBeInTheDocument();

    fireEvent.click(resultList.getByRole("button", { name: /kedarkantha/i }));

    expect(scrollTo).toHaveBeenCalled();
    expect(document.getElementById("trek-search-results")).toBeNull();
  });
});
