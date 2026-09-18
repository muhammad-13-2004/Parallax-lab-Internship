import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  args: {
    label: "Search products",
    placeholder: "Headphones, linen, oak…",
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithHint: Story = {
  args: {
    hint: "Search matches title, description, and category.",
  },
};

export const WithError: Story = {
  args: {
    error: "Enter at least two characters.",
    defaultValue: "x",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Unavailable",
  },
};

export const WithIcon: Story = {
  args: {
    trailing: <Search className="size-4" aria-hidden="true" />,
    type: "search",
  },
};
