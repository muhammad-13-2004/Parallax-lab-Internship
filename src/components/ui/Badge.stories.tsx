import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/components/ui/Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  args: { children: "Electronics" },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Neutral: Story = {};

export const Status: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="ok">In stock</Badge>
      <Badge tone="warn">Low stock · 3 left</Badge>
      <Badge tone="danger">Out of stock</Badge>
      <Badge tone="accent">New</Badge>
    </div>
  ),
};
