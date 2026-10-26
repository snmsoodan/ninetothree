import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HouseholdList, type HouseholdMember } from "./HouseholdList";

const maya: HouseholdMember = {
  userId: "u1",
  role: "parent",
  email: "maya@example.com",
  name: "Maya",
  isYou: true,
};

const sam: HouseholdMember = {
  userId: "u2",
  role: "partner",
  email: "sam@example.com",
  name: "Sam",
  isYou: false,
};

describe("HouseholdList", () => {
  it("calls you You, not your name", () => {
    render(<HouseholdList members={[maya]} />);
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.queryByText("Maya")).not.toBeInTheDocument();
  });

  it("names the role", () => {
    render(<HouseholdList members={[maya, sam]} />);
    expect(screen.getByText("Parent")).toBeInTheDocument();
    expect(screen.getByText("Partner")).toBeInTheDocument();
  });

  it("shows a partner's name and address", () => {
    render(<HouseholdList members={[maya, sam]} />);
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
  });

  it("falls back to the address when there is no name, and does not repeat it", () => {
    render(<HouseholdList members={[maya, { ...sam, name: null }]} />);
    expect(screen.getAllByText("sam@example.com")).toHaveLength(1);
  });

  it("treats a blank name as no name", () => {
    render(<HouseholdList members={[maya, { ...sam, name: "   " }]} />);
    expect(screen.getAllByText("sam@example.com")).toHaveLength(1);
  });

  it("says it is only you when it is", () => {
    render(<HouseholdList members={[maya]} />);
    expect(screen.getByText(/It is only you here/)).toBeInTheDocument();
  });

  it("explains what a second person sees when there is one", () => {
    render(<HouseholdList members={[maya, sam]} />);
    expect(screen.getByText(/Your own notes and your own progress stay yours/)).toBeInTheDocument();
  });

  it("labels a grandparent and a carer", () => {
    render(
      <HouseholdList
        members={[
          maya,
          { ...sam, userId: "u3", role: "grandparent" },
          { ...sam, userId: "u4", role: "carer" },
        ]}
      />,
    );
    expect(screen.getByText("Grandparent")).toBeInTheDocument();
    expect(screen.getByText("Carer")).toBeInTheDocument();
  });
});
