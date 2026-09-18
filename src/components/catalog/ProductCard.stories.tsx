import type { Meta, StoryObj } from "@storybook/react";
import { ProductCard } from "@/components/catalog/ProductCard";
import {
  lowStockProduct,
  outOfStockProduct,
  sampleProduct,
} from "@/components/catalog/sample-product";

const meta: Meta<typeof ProductCard> = {
  title: "Catalog/ProductCard",
  component: ProductCard,
  args: {
    product: sampleProduct,
    layout: "grid",
  },
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Grid: Story = {};

export const List: Story = {
  args: { layout: "list" },
};

export const LowStock: Story = {
  args: { product: lowStockProduct },
};

export const OutOfStock: Story = {
  args: { product: outOfStockProduct },
};
