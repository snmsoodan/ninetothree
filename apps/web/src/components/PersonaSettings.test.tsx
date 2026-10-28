import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PERSONA_META } from "@ninetothree/content/core";
import { PersonaSettings } from "./PersonaSettings";

function setup(
  patch: { persona?: "parent" | "partner" | "grandparent" | "extended"; humour?: boolean } = {},
) {
  const onPersona = vi.fn();
  const onHumour = vi.fn();
  render(
    <PersonaSettings
      persona={patch.persona ?? "parent"}
      humour={patch.humour ?? true}
      onPersona={onPersona}
      onHumour={onHumour}
    />,
  );
  return { onPersona, onHumour };
}

describe("PersonaSettings", () => {
  it("offers all four readers, in one group", () => {
    setup();
    const group = screen.getByRole("radiogroup", { name: "Reading as" });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("shows each reader's own description, so nobody has to try one to find out", () => {
    setup();
    for (const meta of Object.values(PERSONA_META)) {
      expect(screen.getByRole("radio", { name: new RegExp(meta.label) })).toBeInTheDocument();
      expect(screen.getByText(meta.hint)).toBeInTheDocument();
    }
  });

  it("shows the stored answer", () => {
    setup({ persona: "grandparent" });
    expect(screen.getByRole("radio", { name: /I am a grandparent/ })).toBeChecked();
  });

  it("reports a change of reader as one answer", async () => {
    const { onPersona } = setup();
    await userEvent.click(screen.getByRole("radio", { name: /I am the other parent/ }));
    expect(onPersona).toHaveBeenCalledWith("partner");
    expect(onPersona).toHaveBeenCalledTimes(1);
  });

  it("lets the light line be turned off, and back on", async () => {
    const { onHumour } = setup();
    const box = screen.getByRole("checkbox", { name: /A light line now and then/ });
    expect(box).toBeChecked();
    await userEvent.click(box);
    expect(onHumour).toHaveBeenCalledWith(false);
  });

  it("reflects a stored off, and says off is a complete answer", () => {
    setup({ humour: false });
    expect(screen.getByRole("checkbox", { name: /A light line now and then/ })).not.toBeChecked();
    expect(screen.getByText(/Off is a complete answer/)).toBeInTheDocument();
  });

  it("promises the light line is never about the hard things", () => {
    setup();
    expect(
      screen.getByText(/Never about the baby, your body, money or feeding/),
    ).toBeInTheDocument();
  });
});
