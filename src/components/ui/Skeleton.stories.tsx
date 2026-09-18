import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { CatalogSkeleton } from "@/components/catalog/ProductCardSkeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Bar: Story = {
  args: { className: "h-6 w-48" },
};

export const ProductCardGrid: Story = {
  render: () => <CatalogSkeleton layout="grid" count={4} />,
};

export const ProductCardList: Story = {
  render: () => <CatalogSkeleton layout="list" count={3} />,
};
