import { ShopBridge } from "@/components/shop/ShopBridge";

export default function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ShopBridge />
      {children}
    </>
  );
}
