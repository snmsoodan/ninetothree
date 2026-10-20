import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RedFlagList } from "./RedFlagList";
import { TEST_PACK } from "@/test-fixtures";

describe("RedFlagList", () => {
  it("shows every flag", () => {
    render(<RedFlagList flags={TEST_PACK.redFlags} />);
    expect(screen.getByText("Bleeding, or fluid that will not stop.")).toBeInTheDocument();
    expect(screen.getByText("A bad headache with blurred vision.")).toBeInTheDocument();
  });

  it("says what to do, not just what is wrong", () => {
    render(<RedFlagList flags={TEST_PACK.redFlags} />);
    expect(screen.getByText(/Call 911/)).toBeInTheDocument();
    expect(screen.getByText(/Call your OB triage line/)).toBeInTheDocument();
  });

  it("shows the phone number when the flag carries one", () => {
    render(<RedFlagList flags={TEST_PACK.redFlags} />);
    expect(screen.getByText(/555-0100/)).toBeInTheDocument();
  });

  it("is never collapsed behind a disclosure", () => {
    render(<RedFlagList flags={TEST_PACK.redFlags} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("drops the reassurance line in compact mode", () => {
    render(<RedFlagList flags={TEST_PACK.redFlags} compact />);
    expect(screen.queryByText(/You will not be wasting anyone/)).not.toBeInTheDocument();
  });

  it("shows an escalation that has no number at all", () => {
    render(
      <RedFlagList
        flags={[{ id: "rf", text: "A fever in a newborn.", escalation: "call-pediatrician" }]}
      />,
    );
    expect(screen.getByText("Call your pediatrician")).toBeInTheDocument();
  });

  it("renders nothing when there are no flags", () => {
    const { container } = render(<RedFlagList flags={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
