import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfflineLine, OfflineNote } from "./OfflineNote";

/** jsdom's `navigator.onLine` is a getter, so it has to be redefined. */
function setOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => online });
}

afterEach(() => {
  setOnline(true);
});

describe("OfflineNote", () => {
  it("says nothing when there is a signal", () => {
    setOnline(true);
    const { container } = render(<OfflineNote />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says the copy is a copy when there is no signal", () => {
    setOnline(false);
    render(<OfflineNote />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "You are offline. This is the copy saved on your device.",
    );
  });

  it("tells the truth about the safety page, which is why it exists", () => {
    setOnline(false);
    render(<OfflineNote safety />);
    expect(screen.getByRole("status")).toHaveTextContent("These numbers are always right.");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Anything added to this page since you last opened it is not here.",
    );
  });

  it("appears when the signal drops, without a reload", () => {
    setOnline(true);
    render(<OfflineNote />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    setOnline(false);
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("goes away when the signal comes back", () => {
    setOnline(false);
    render(<OfflineNote />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    setOnline(true);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("stops listening when it unmounts", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<OfflineNote />);
    unmount();
    expect(remove).toHaveBeenCalledWith("online", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("offline", expect.any(Function));
    remove.mockRestore();
  });
});

describe("OfflineLine", () => {
  it("is the same sentence the wrapper shows, so the story is not a mock", () => {
    render(<OfflineLine />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "You are offline. This is the copy saved on your device.",
    );
  });
});
