import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  args: {
    title: "No products found",
    description:
      "Nothing matches that search and category. Clear the filters to see the full catalog.",
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: <Button variant="secondary">Reset filters</Button>,
  },
};
