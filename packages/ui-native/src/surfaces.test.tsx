import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Callout, Card, CardBody, CardFooter, CardHeader, Skeleton } from "./surfaces.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Body } from "./text.tsx";

describe("Card", () => {
  it("lifts a raised card off the page", () => {
    const { container } = render(
      <Card>
        <Body>content</Body>
      </Card>,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.style.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(card.style.boxShadow).not.toBe("");
    expect(card.style.borderTopWidth).toBe("0px");
  });

  it("sinks a sunken card and outlines a plain one", () => {
    const sunken = render(
      <Card tone="sunken">
        <Body>content</Body>
      </Card>,
    ).container.firstElementChild as HTMLElement;
    expect(sunken.style.backgroundColor).toBe("rgb(244, 240, 234)");
    expect(sunken.style.boxShadow).toBe("");

    const plain = render(
      <Card tone="plain">
        <Body>content</Body>
      </Card>,
    ).container.firstElementChild as HTMLElement;
    expect(plain.style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(plain.style.borderTopWidth).toBe("1px");
  });

  it("sections a card without inventing a heading", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <Body size="sm">Header</Body>
        </CardHeader>
        <CardBody>
          <Body>Body</Body>
        </CardBody>
        <CardFooter>
          <Body size="sm">Footer</Body>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByText("Header")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
    const footer = screen.getByText("Footer").parentElement as HTMLElement;
    expect(footer.style.borderTopWidth).toBe("1px");
    expect(container).toBeTruthy();
  });
});

describe("Callout", () => {
  it("is a sage note by default", () => {
    const { container } = render(<Callout title="Worth knowing">Take it slowly.</Callout>);
    const callout = container.firstElementChild as HTMLElement;
    expect(callout.style.backgroundColor).toBe("rgb(238, 242, 238)");
    expect(callout.style.borderLeftColor).toBe("rgb(79, 107, 81)");
    expect(callout.style.borderLeftWidth).toBe("3px");
    expect(screen.getByText("Worth knowing").style.fontWeight).toBe("600");
  });

  it("turns amber for a caution and red only when something is wrong", () => {
    const caution = render(<Callout tone="caution">Watch this.</Callout>).container
      .firstElementChild as HTMLElement;
    expect(caution.style.backgroundColor).toBe("rgb(248, 242, 226)");
    expect(caution.style.borderLeftColor).toBe("rgb(138, 106, 31)");

    const danger = render(<Callout tone="danger">Call someone.</Callout>).container
      .firstElementChild as HTMLElement;
    expect(danger.style.backgroundColor).toBe("rgb(251, 237, 237)");
    expect(danger.style.borderLeftColor).toBe("rgb(163, 46, 46)");
  });

  it("follows the theme when one is provided", () => {
    const { container } = render(
      <ThemeProvider mode="dark">
        <Callout>At night.</Callout>
      </ThemeProvider>,
    );
    const callout = container.firstElementChild as HTMLElement;
    expect(callout.style.backgroundColor).not.toBe("rgb(238, 242, 238)");
  });
});

describe("Skeleton", () => {
  it("holds the shape of what is coming and says so", () => {
    const { container } = render(<Skeleton height={24} width={120} />);
    const skeleton = container.firstElementChild as HTMLElement;
    expect(skeleton.style.height).toBe("24px");
    expect(skeleton.style.width).toBe("120px");
    expect(skeleton.getAttribute("aria-label")).toBe("Loading");
  });

  it("spans the column by default", () => {
    const { container } = render(<Skeleton />);
    expect((container.firstElementChild as HTMLElement).style.width).toBe("100%");
  });
});
