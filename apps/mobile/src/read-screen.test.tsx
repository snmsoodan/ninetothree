import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@ninetothree/ui-native";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { readArticleView, readIndexView } from "./read";
import { ReadArticle, ReadIndex, type ReadHandlers } from "./read-screen";

const MIND = ARTICLES.find((article) => article.domain === "mind")!;
const CALM = ARTICLES.find((article) => article.domain !== "mind")!;

function handlers(): ReadHandlers {
  return { onOpenHref: vi.fn(), onOpenUrl: vi.fn(), onCall: vi.fn(), onBack: vi.fn() };
}

function drawIndex() {
  const spies = handlers();
  render(
    <ThemeProvider mode="light">
      <ReadIndex model={readIndexView()} handlers={spies} />
    </ThemeProvider>,
  );
  return spies;
}

function drawArticle(id: string) {
  const spies = handlers();
  render(
    <ThemeProvider mode="light">
      <ReadArticle model={readArticleView(id)} handlers={spies} />
    </ThemeProvider>,
  );
  return spies;
}

describe("ReadIndex", () => {
  it("lists every article with its summary", () => {
    drawIndex();
    expect(screen.getAllByTestId(/^article-/).length).toBe(ARTICLES.length);
    expect(screen.getByText(ARTICLES[0]!.summary)).toBeTruthy();
  });

  it("opens the article a row names", () => {
    const spies = drawIndex();
    fireEvent.click(screen.getByTestId(`open-${ARTICLES[0]!.id}`));
    expect(spies.onOpenHref).toHaveBeenCalledWith(`/read/${ARTICLES[0]!.id}`);
  });
});

describe("ReadArticle", () => {
  it("dials the support line as well as the crisis line", () => {
    const spies = drawArticle(MIND.id);
    fireEvent.click(screen.getByTestId("call-support"));
    expect(spies.onCall).toHaveBeenCalled();
  });

  it("draws the prose, then the sources", () => {
    drawArticle(CALM.id);
    expect(screen.getByText(CALM.title)).toBeTruthy();
    expect(screen.getByTestId("read-sources")).toBeTruthy();
    expect(screen.getAllByTestId(/^source-/).length).toBe(CALM.sources.length);
  });

  it("opens a source in the browser", () => {
    const spies = drawArticle(CALM.id);
    fireEvent.click(screen.getByTestId("source-0"));
    expect(spies.onOpenUrl).toHaveBeenCalledWith(CALM.sources[0]!.url);
  });

  it("links a related step back to its week", () => {
    const spies = drawArticle(CALM.id);
    const model = readArticleView(CALM.id);
    if (!model.found || model.related.length === 0) return;
    fireEvent.click(screen.getByTestId(`related-${model.related[0]!.id}`));
    expect(spies.onOpenHref).toHaveBeenCalledWith(model.related[0]!.href);
  });

  it("carries both numbers on a mind article", () => {
    const spies = drawArticle(MIND.id);
    expect(screen.getByTestId("read-crisis")).toBeTruthy();
    fireEvent.click(screen.getByTestId("call-crisis"));
    expect(spies.onCall).toHaveBeenCalledWith("988");
  });

  it("keeps the numbers off an article about something else", () => {
    drawArticle(CALM.id);
    expect(screen.queryByTestId("read-crisis")).toBeNull();
  });

  it("goes back without a history push", () => {
    const spies = drawArticle(CALM.id);
    fireEvent.click(screen.getByTestId("read-back"));
    expect(spies.onBack).toHaveBeenCalled();
  });

  it("says not found for a slug that is gone", () => {
    drawArticle("gone");
    expect(screen.getAllByText("Not found").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("read-sources")).toBeNull();
  });
});
