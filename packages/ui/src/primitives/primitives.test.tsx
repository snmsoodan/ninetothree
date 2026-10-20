import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { ButtonLink } from "./ButtonLink";
import { Card, CardBody, CardFooter, CardHeader } from "./Card";
import { Checkbox } from "./Checkbox";
import { Dialog } from "./Dialog";
import { Progress } from "./Progress";
import { RadioGroup } from "./RadioGroup";
import { Tabs } from "./Tabs";
import { TextLink } from "./TextLink";
import { ToastProvider, useToast } from "./Toast";

describe("Button", () => {
  it("defaults to a non-submitting button", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("honours an explicit type", () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "submit");
  });

  it("applies the variant and size classes", () => {
    render(
      <Button variant="danger" size="lg" block>
        Erase
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Erase" });
    expect(button.className).toContain("bg-red");
    expect(button.className).toContain("h-13");
    expect(button.className).toContain("w-full");
  });

  it("merges a caller className last", () => {
    render(<Button className="mt-4">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" }).className).toContain("mt-4");
  });

  it("forwards a ref", () => {
    let node: HTMLButtonElement | null = null;
    render(
      <Button
        ref={(el) => {
          node = el;
        }}
      >
        Go
      </Button>,
    );
    expect(node).toBeInstanceOf(HTMLButtonElement);
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("ButtonLink", () => {
  it("renders an anchor, never a button", () => {
    render(<ButtonLink href="/week">Next</ButtonLink>);
    const link = screen.getByRole("link", { name: "Next" });
    expect(link.tagName).toBe("A");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps a hit area at least as tall as the button it imitates", () => {
    render(<ButtonLink href="/week">Next</ButtonLink>);
    expect(screen.getByRole("link", { name: "Next" }).className).toContain("min-h-11");
  });

  it("applies variant, size and block", () => {
    render(
      <ButtonLink href="/week" variant="quiet" size="sm" block>
        Next
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Next" });
    expect(link.className).toContain("bg-transparent");
    expect(link.className).toContain("min-h-9");
    expect(link.className).toContain("w-full");
  });

  it("renders whatever element it is given, so an app can pass its router", () => {
    function FakeLink({ href, children }: { href: string; children: React.ReactNode }) {
      return (
        <a href={href} data-router="yes">
          {children}
        </a>
      );
    }
    render(
      <ButtonLink as={FakeLink} href="/week">
        Next
      </ButtonLink>,
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("data-router", "yes");
  });
});

describe("Card", () => {
  it("renders raised by default with its sections", () => {
    render(
      <Card data-testid="card">
        <CardHeader>Head</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Foot</CardFooter>
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("bg-paper-raised");
    expect(screen.getByText("Head")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Foot")).toBeInTheDocument();
  });

  it("renders the sunken and plain tones", () => {
    const { rerender } = render(<Card tone="sunken" data-testid="card" />);
    expect(screen.getByTestId("card").className).toContain("bg-paper-sunken");
    rerender(<Card tone="plain" data-testid="card" />);
    expect(screen.getByTestId("card").className).toContain("bg-transparent");
  });
});

describe("Badge", () => {
  it("renders neutral by default", () => {
    render(<Badge>Week 28</Badge>);
    expect(screen.getByText("Week 28").className).toContain("bg-paper-sunken");
  });

  it("renders each tone", () => {
    const tones = ["sage", "clay", "amber", "red"] as const;
    for (const tone of tones) {
      const { unmount } = render(<Badge tone={tone}>{tone}</Badge>);
      expect(screen.getByText(tone).className).toContain(`text-${tone}`);
      unmount();
    }
  });
});

describe("Checkbox", () => {
  it("derives an id from the label and links it", () => {
    render(<Checkbox label="I have a car" />);
    const box = screen.getByRole("checkbox", { name: "I have a car" });
    expect(box).toHaveAttribute("id", "cb-i-have-a-car");
  });

  it("uses an explicit id when given", () => {
    render(<Checkbox id="car" label="I have a car" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("id", "car");
  });

  it("shows a hint when given and omits it otherwise", () => {
    const { rerender } = render(<Checkbox label="Car" hint="We will skip the car seat." />);
    expect(screen.getByText("We will skip the car seat.")).toBeInTheDocument();
    rerender(<Checkbox label="Car" />);
    expect(screen.queryByText("We will skip the car seat.")).not.toBeInTheDocument();
  });

  it("toggles on click", async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Car" onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe("Progress", () => {
  it("exposes the value to assistive tech", () => {
    render(<Progress value={40} label="This week" />);
    const bar = screen.getByRole("progressbar", { name: "This week" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("clamps out-of-range values", () => {
    const { rerender } = render(<Progress value={-20} label="This week" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    rerender(<Progress value={180} label="This week" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("rounds fractional values", () => {
    render(<Progress value={33.6} label="This week" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "34");
  });

  it("hides the numeric readout when asked", () => {
    render(<Progress value={40} label="This week" hideValue />);
    expect(screen.queryByText("40%")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("TextLink", () => {
  it("renders an internal link without a new-tab warning", () => {
    render(<TextLink href="/shelf">Shelf</TextLink>);
    const link = screen.getByRole("link", { name: "Shelf" });
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("opens external links in a new tab and says so", () => {
    render(
      <TextLink href="https://cdc.gov" external>
        CDC
      </TextLink>,
    );
    const link = screen.getByRole("link", { name: /CDC/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAccessibleName("CDC (opens in a new tab)");
  });
});

describe("Dialog", () => {
  it("renders nothing when closed", () => {
    render(<Dialog open={false} onOpenChange={() => {}} title="Skip this?" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders title, description, children and footer when open", () => {
    render(
      <Dialog
        open
        onOpenChange={() => {}}
        title="Skip this?"
        description="It will stay on your shelf."
        footer={<Button>Keep it</Button>}
      >
        <p>Pick a reason</p>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Skip this?")).toBeInTheDocument();
    expect(screen.getByText("It will stay on your shelf.")).toBeInTheDocument();
    expect(screen.getByText("Pick a reason")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep it" })).toBeInTheDocument();
  });

  it("omits the optional parts", () => {
    render(<Dialog open onOpenChange={() => {}} title="Skip this?" />);
    expect(screen.queryByText("Pick a reason")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("closes via the close button", async () => {
    const onOpenChange = vi.fn();
    render(<Dialog open onOpenChange={onOpenChange} title="Skip this?" />);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes on Escape", async () => {
    const onOpenChange = vi.fn();
    render(<Dialog open onOpenChange={onOpenChange} title="Skip this?" />);
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("makes the page behind it inert, and gives it back on close", () => {
    const root = document.createElement("div");
    root.id = "app-root";
    document.body.append(root);

    const { rerender } = render(<Dialog open onOpenChange={() => {}} title="Skip this?" />);
    expect(root).toHaveAttribute("inert");

    rerender(<Dialog open={false} onOpenChange={() => {}} title="Skip this?" />);
    expect(root).not.toHaveAttribute("inert");

    root.remove();
  });

  it("keeps the page inert until the last of two dialogs closes", () => {
    const root = document.createElement("div");
    root.id = "app-root";
    document.body.append(root);

    const { rerender } = render(
      <>
        <Dialog open onOpenChange={() => {}} title="First" />
        <Dialog open onOpenChange={() => {}} title="Second" />
      </>,
    );
    expect(root).toHaveAttribute("inert");

    rerender(
      <>
        <Dialog open={false} onOpenChange={() => {}} title="First" />
        <Dialog open onOpenChange={() => {}} title="Second" />
      </>,
    );
    expect(root).toHaveAttribute("inert");

    rerender(
      <>
        <Dialog open={false} onOpenChange={() => {}} title="First" />
        <Dialog open={false} onOpenChange={() => {}} title="Second" />
      </>,
    );
    expect(root).not.toHaveAttribute("inert");

    root.remove();
  });

  it("does nothing when there is no app root to inert", () => {
    render(<Dialog open onOpenChange={() => {}} title="Skip this?" />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("RadioGroup", () => {
  it("names each radio and describes it with its hint", () => {
    render(
      <RadioGroup
        name="who"
        label="Who is this for?"
        onValueChange={() => {}}
        options={[
          { value: "pregnant", label: "I am pregnant" },
          { value: "parent", label: "My baby is here", hint: "Congratulations." },
        ]}
      />,
    );
    expect(screen.getByRole("radio", { name: "I am pregnant" })).toBeInTheDocument();
    const parent = screen.getByRole("radio", { name: "My baby is here" });
    expect(parent).toHaveAccessibleDescription("Congratulations.");
  });

  const options = [
    { value: "pregnant", label: "I am pregnant" },
    { value: "parent", label: "My baby is here", hint: "Congratulations." },
  ];

  it("renders every option with its hint", () => {
    render(
      <RadioGroup
        name="status"
        label="Where are you?"
        options={options}
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "Where are you?" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "I am pregnant" })).toBeInTheDocument();
    expect(screen.getByText("Congratulations.")).toBeInTheDocument();
  });

  it("reports the chosen value", async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        name="status"
        label="Where are you?"
        options={options}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "I am pregnant" }));
    expect(onValueChange).toHaveBeenCalledWith("pregnant");
  });

  it("reflects a controlled value", () => {
    render(
      <RadioGroup
        name="status"
        label="Where are you?"
        options={options}
        value="parent"
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByRole("radio", { name: /My baby is here/ })).toBeChecked();
  });
});

describe("Tabs", () => {
  const items = [
    { value: "now", label: "This week", content: <p>Now content</p> },
    { value: "later", label: "Coming up", content: <p>Later content</p> },
  ];

  it("shows the first tab by default", () => {
    render(<Tabs items={items} label="Week sections" />);
    expect(screen.getByRole("tablist", { name: "Week sections" })).toBeInTheDocument();
    expect(screen.getByText("Now content")).toBeInTheDocument();
    expect(screen.queryByText("Later content")).not.toBeInTheDocument();
  });

  it("switches tabs on click", async () => {
    render(<Tabs items={items} label="Week sections" />);
    await userEvent.click(screen.getByRole("tab", { name: "Coming up" }));
    expect(screen.getByText("Later content")).toBeInTheDocument();
  });

  it("honours a default value", () => {
    render(<Tabs items={items} label="Week sections" defaultValue="later" />);
    expect(screen.getByText("Later content")).toBeInTheDocument();
  });

  it("survives an empty item list", () => {
    render(<Tabs items={[]} label="Week sections" />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});

describe("Toast", () => {
  function Trigger() {
    const { notify } = useToast();
    return <Button onClick={() => notify("Saved to your shelf")}>Notify</Button>;
  }

  it("throws when used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });

  it("announces a message politely and clears it", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider durationMs={1000}>
        <Trigger />
      </ToastProvider>,
    );
    await act(async () => {
      screen.getByRole("button", { name: "Notify" }).click();
    });
    expect(screen.getByText("Saved to your shelf")).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText("Saved to your shelf")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("restarts the timer when a second message arrives", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider durationMs={1000}>
        <Trigger />
      </ToastProvider>,
    );
    await act(async () => {
      screen.getByRole("button", { name: "Notify" }).click();
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    await act(async () => {
      screen.getByRole("button", { name: "Notify" }).click();
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByText("Saved to your shelf")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("clears its timer on unmount", async () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await act(async () => {
      screen.getByRole("button", { name: "Notify" }).click();
    });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});

describe("cn", () => {
  it("joins truthy classes and drops falsy ones", async () => {
    const { cn } = await import("../cn");
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});

describe("a controlled dialog round trip", () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Skip this?"
          footer={<Button onClick={() => setOpen(false)}>Keep it</Button>}
        />
      </>
    );
  }

  it("opens and closes", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Keep it" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
