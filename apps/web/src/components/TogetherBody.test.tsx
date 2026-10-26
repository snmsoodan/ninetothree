import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TogetherBody, type TogetherPayload } from "./TogetherBody";

const data: TogetherPayload = {
  id: "h1",
  role: "partner",
  members: [
    { userId: "u1", role: "parent", email: "maya@example.com", name: "Maya", isYou: false },
    { userId: "u2", role: "partner", email: "sam@example.com", name: "Sam", isYou: true },
  ],
  shared: [],
  appointments: [],
  week: {
    id: "pregnancy-w28",
    title: "Week 28",
    subtitle: null,
    body: "Your ribs are running out of room.",
    mind: null,
    help: [],
  },
};

describe("TogetherBody", () => {
  it("shows the four sections in one place", () => {
    render(<TogetherBody data={data} />);
    expect(screen.getByRole("heading", { name: "How to help this week" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Shared" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Coming up" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Who is here" })).toBeInTheDocument();
  });

  it("promises that notes stay with the person who wrote them", () => {
    render(<TogetherBody data={data} />);
    expect(
      screen.getByText(/Notes, mood answers and anything you have not shared/),
    ).toBeInTheDocument();
  });

  it("points at settings for inviting somebody", () => {
    render(<TogetherBody data={data} />);
    expect(screen.getByRole("link", { name: "Invite someone" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("does not name the other person when there are two of them", () => {
    render(
      <TogetherBody
        data={{
          ...data,
          members: [
            ...data.members,
            {
              userId: "u3",
              role: "grandparent",
              email: "nan@example.com",
              name: "Nan",
              isYou: false,
            },
          ],
        }}
      />,
    );
    const section = screen.getByRole("heading", { name: "Who is here" }).closest("section")!;
    expect(section.textContent).toContain("Nan");
    expect(screen.queryByText(/from Sam/)).not.toBeInTheDocument();
  });

  it("shows an appointment with no who and no place", () => {
    render(
      <TogetherBody
        data={{
          ...data,
          appointments: [
            {
              id: "ap1",
              title: "Glucose test",
              kind: null,
              dueAt: "2026-11-02T15:00:00.000Z",
              who: null,
              location: null,
            },
          ],
        }}
      />,
    );
    const section = screen.getByRole("heading", { name: "Coming up" }).closest("section")!;
    expect(section.textContent).toContain("Glucose test");
    expect(section.textContent).not.toContain("·");
  });

  it("shows your own address under your own name", () => {
    render(<TogetherBody data={data} />);
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
  });

  it("shows a nameless other person by their address, and you as You", () => {
    render(
      <TogetherBody
        data={{
          ...data,
          members: [
            { userId: "u1", role: "parent", email: "maya@example.com", name: null, isYou: false },
            { userId: "u2", role: "partner", email: "sam@example.com", name: null, isYou: true },
          ],
        }}
      />,
    );
    const section = screen.getByRole("heading", { name: "Who is here" }).closest("section")!;
    expect(section.textContent).toContain("maya@example.com · parent");
    // Your own row says "You" and does not repeat an address you already know.
    expect(section.textContent).toContain("You · partner");
    expect(section.textContent).not.toContain("sam@example.com");
  });
});
