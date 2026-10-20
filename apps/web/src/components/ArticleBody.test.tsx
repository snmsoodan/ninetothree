import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticleBody } from "./ArticleBody";

/**
 * `ArticleBody` is an async server component, so it is awaited rather than
 * rendered by React. `compileMDX` resolves to a plain element, which the
 * testing library can then mount.
 */
async function mount(body: string) {
  const element = await ArticleBody({ body });
  return render(element);
}

describe("ArticleBody", () => {
  it("renders the Markdown as prose", async () => {
    await mount("## A heading\n\nA paragraph with **weight**.");
    expect(screen.getByRole("heading", { level: 2, name: "A heading" })).toBeInTheDocument();
    expect(screen.getByText("weight")).toBeInTheDocument();
  });

  it("renders a list and a link", async () => {
    await mount("- one\n- two\n\n[ACOG](https://www.acog.org/)");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "ACOG" })).toHaveAttribute(
      "href",
      "https://www.acog.org/",
    );
  });

  it("gives the prose the class the stylesheet expects", async () => {
    const { container } = await mount("A paragraph.");
    expect(container.querySelector(".article-body")).not.toBeNull();
  });
});
