import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Body, Heading, SectionHeader } from "./text.tsx";

describe("Heading", () => {
  it("is a heading to a screen reader, not only a big word", () => {
    render(<Heading>Week 21</Heading>);
    expect(screen.getByRole("heading")).toHaveTextContent("Week 21");
  });

  it("takes its size and its leading from the tokens, per level", () => {
    const { container } = render(
      <>
        <Heading level={1}>Page</Heading>
        <Heading level={2}>Section</Heading>
        <Heading level={3}>Card</Heading>
      </>,
    );
    const [page, section, card] = Array.from(
      container.querySelectorAll("h1, h2, h3, div[role=heading], [role=heading]"),
    );
    expect((page as HTMLElement).style.fontSize).toBe("36px");
    expect((page as HTMLElement).style.lineHeight).toBe("43.2px");
    expect((section as HTMLElement).style.fontSize).toBe("28px");
    expect((card as HTMLElement).style.fontSize).toBe("22px");
  });
});

describe("Body", () => {
  it("is muted, small and capped at the measure when asked", () => {
    const { container } = render(
      <Body size="sm" muted>
        A sentence.
      </Body>,
    );
    const text = container.firstElementChild as HTMLElement;
    expect(text.style.fontSize).toBe("15px");
    expect(text.style.color).toBe("rgb(92, 83, 76)");
    // 66ch at 15 points: 66 × 15 × 0.5.
    expect(text.style.maxWidth).toBe("495px");
  });

  it("is ink, body-sized and uncapped by default when measure is off", () => {
    const { container } = render(<Body measure={false}>A sentence.</Body>);
    const text = container.firstElementChild as HTMLElement;
    expect(text.style.fontSize).toBe("17px");
    expect(text.style.color).toBe("rgb(31, 27, 24)");
    expect(text.style.maxWidth).toBe("");
  });
});

describe("SectionHeader", () => {
  it("renders the title alone when there is nothing to do", () => {
    render(<SectionHeader title="This week" />);
    expect(screen.getByRole("heading")).toHaveTextContent("This week");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a trailing action that is reachable by role and by name", () => {
    const onPress = vi.fn();
    render(<SectionHeader title="This week" action={{ label: "See all", onPress }} />);
    fireEvent.click(screen.getByRole("button", { name: "See all" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
