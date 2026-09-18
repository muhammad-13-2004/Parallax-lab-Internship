import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";

const meta: Meta<typeof Toggle> = {
  title: "UI/Toggle",
  component: Toggle,
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Pressed: Story = {
  args: {
    pressed: true,
    children: "Grid",
  },
};

export const Unpressed: Story = {
  args: {
    pressed: false,
    children: "List",
  },
};

export const ViewGroup: Story = {
  render: function ViewGroupStory() {
    const [view, setView] = useState<"grid" | "list">("grid");
    return (
      <div role="group" aria-label="Product layout" className="inline-flex rounded-md bg-surface p-1 shadow-border">
        <Toggle pressed={view === "grid"} onClick={() => setView("grid")} aria-label="Grid view">
          <LayoutGrid className="size-4" aria-hidden="true" />
          Grid
        </Toggle>
        <Toggle pressed={view === "list"} onClick={() => setView("list")} aria-label="List view">
          <List className="size-4" aria-hidden="true" />
          List
        </Toggle>
      </div>
    );
  },
};
