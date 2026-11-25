import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge, Button, Chip, LinkRow, PinButton } from "./controls.tsx";

describe("Button", () => {
  it("is a button with a name, and presses once", () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Start week 21</Button>);
    const button = screen.getByRole("button", { name: "Start week 21" });
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(button.style.minHeight).toBe("44px");
    expect(button.style.backgroundColor).toBe("rgb(31, 27, 24)");
  });

  it("is secondary with a hairline, quiet with no fill, danger in red", () => {
    const secondary = render(<Button variant="secondary">B</Button>).container
      .firstElementChild as HTMLElement;
    // A border becomes four longhands on the web, so the top edge stands for it.
    expect(secondary.style.borderTopWidth).toBe("1px");
    expect(secondary.style.borderTopColor).toBe("rgb(214, 206, 196)");

    const quiet = render(<Button variant="quiet">Q</Button>).container
      .firstElementChild as HTMLElement;
    expect(quiet.style.backgroundColor).toBe("rgba(0, 0, 0, 0)");

    const danger = render(<Button variant="danger">D</Button>).container
      .firstElementChild as HTMLElement;
    expect(danger.style.backgroundColor).toBe("rgb(163, 46, 46)");
  });

  it("never shrinks below a thumb's target, even at the small size", () => {
    const small = render(<Button size="sm">S</Button>).container.firstElementChild as HTMLElement;
    expect(small.style.minHeight).toBe("44px");

    const large = render(<Button size="lg">L</Button>).container.firstElementChild as HTMLElement;
    expect(large.style.minHeight).toBe("52px");
    expect(large.style.paddingLeft).toBe("24px");
  });

  it("stretches when block, and stays put otherwise", () => {
    const block = render(<Button block>Go</Button>).container.firstElementChild as HTMLElement;
    expect(block.style.alignSelf).toBe("stretch");

    const inline = render(<Button>Go</Button>).container.firstElementChild as HTMLElement;
    expect(inline.style.alignSelf).toBe("flex-start");
  });

  it("cannot be pressed while disabled, and says it is", () => {
    const onPress = vi.fn();
    render(
      <Button disabled onPress={onPress}>
        Later
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Later" });
    expect(button).toBeDisabled();
    expect(button.style.opacity).toBe("0.45");
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("Badge", () => {
  it("is neutral by default and takes each tone's wash and ink", () => {
    const neutral = render(<Badge>New</Badge>).container.firstElementChild as HTMLElement;
    expect(neutral.style.backgroundColor).toBe("rgb(244, 240, 234)");

    const sage = render(<Badge tone="sage">New</Badge>).container.firstElementChild as HTMLElement;
    expect(sage.style.backgroundColor).toBe("rgb(238, 242, 238)");

    const clay = render(<Badge tone="clay">New</Badge>).container.firstElementChild as HTMLElement;
    expect(clay.style.backgroundColor).toBe("rgb(247, 238, 234)");

    const red = render(<Badge tone="red">New</Badge>).container.firstElementChild as HTMLElement;
    expect(red.style.backgroundColor).toBe("rgb(251, 237, 237)");
  });
});

describe("Chip", () => {
  it("is a checkbox, so a screen reader hears whether it is chosen", () => {
    const onPress = vi.fn();
    render(<Chip label="First pregnancy" onPress={onPress} />);
    const chip = screen.getByRole("checkbox", { name: "First pregnancy" });
    expect(chip).not.toBeChecked();
    fireEvent.click(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("reports itself as checked when selected, and as disabled when it cannot be", () => {
    render(
      <>
        <Chip label="Chosen" selected />
        <Chip label="Unavailable" disabled />
      </>,
    );
    expect(screen.getByRole("checkbox", { name: "Chosen" })).toBeChecked();
    const unavailable = screen.getByRole("checkbox", { name: "Unavailable" });
    expect(unavailable).toHaveAttribute("aria-disabled", "true");
    expect(unavailable).toHaveAttribute("tabindex", "-1");
  });
});

describe("PinButton", () => {
  it("announces the action and the subject, not a star", () => {
    const onPress = vi.fn();
    render(<PinButton pinned={false} subject="week 21" onPress={onPress} />);
    const button = screen.getByRole("button", { name: "Pin week 21" });
    expect(button.style.minWidth).toBe("44px");
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("says unpin when it is already pinned", () => {
    render(<PinButton pinned subject="week 21" onPress={() => {}} />);
    expect(screen.getByRole("button", { name: "Unpin week 21" })).toBeTruthy();
  });
});

describe("LinkRow", () => {
  it("is a link with the recommendation's reason attached", () => {
    const onPress = vi.fn();
    render(
      <LinkRow label="NHS week by week" detail="The plain-English version" onPress={onPress} />,
    );
    const link = screen.getByRole("link", { name: "NHS week by week" });
    expect(screen.getByText("The plain-English version")).toBeTruthy();
    expect(link.textContent).toContain("›");
    fireEvent.click(link);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("marks an outgoing link so nobody is surprised by leaving", () => {
    render(<LinkRow label="Sleep Foundation" onPress={() => {}} external />);
    expect(screen.getByRole("link", { name: "Sleep Foundation" }).textContent).toContain("↗");
  });
});
