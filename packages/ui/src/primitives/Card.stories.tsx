import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardBody, CardFooter, CardHeader } from "./Card";
import { Button } from "./Button";

const meta: Meta<typeof Card> = {
  title: "Primitives/Card",
  component: Card,
  argTypes: { tone: { control: "select", options: ["raised", "sunken", "plain"] } },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Raised: Story = {
  render: (args) => (
    <Card {...args} className="max-w-md">
      <CardHeader>
        <h3 className="font-display text-lg text-ink">Book your 28-week visit</h3>
      </CardHeader>
      <CardBody>
        <p className="text-base text-ink-muted">
          Your provider will check growth, listen to the heartbeat, and may order a glucose test.
        </p>
      </CardBody>
      <CardFooter>
        <Button size="sm" variant="secondary">
          Mark this done
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const Sunken: Story = { args: { tone: "sunken" }, render: Raised.render };

export const Plain: Story = { args: { tone: "plain" }, render: Raised.render };
