import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/shop/catalogo" },
};

export default function ShopCatalogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
