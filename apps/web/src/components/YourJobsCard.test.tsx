import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { YourJobsCard } from "./YourJobsCard";

describe("YourJobsCard", () => {
  it("renders nothing when there is nothing waiting", () => {
    const { container } = render(<YourJobsCard jobs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says one thing for you", () => {
    render(<YourJobsCard jobs={[{ id: "j1", title: "Book the glucose test", packTitle: null }]} />);
    expect(screen.getByText("One thing for you")).toBeInTheDocument();
    expect(screen.getByText("Book the glucose test")).toBeInTheDocument();
  });

  it("counts more than one", () => {
    render(
      <YourJobsCard
        jobs={[
          { id: "j1", title: "Book the glucose test", packTitle: "Week 28" },
          { id: "j2", title: "Pack the hospital bag", packTitle: null },
        ]}
      />,
    );
    expect(screen.getByText("2 things for you")).toBeInTheDocument();
    expect(screen.getByText(/Week 28/)).toBeInTheDocument();
  });

  it("links to the shared page", () => {
    render(<YourJobsCard jobs={[{ id: "j1", title: "Book the glucose test", packTitle: null }]} />);
    expect(screen.getByRole("link", { name: "Open Together" })).toHaveAttribute(
      "href",
      "/together",
    );
  });
});
