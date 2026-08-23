import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/commissioni/condizioni" },
};

export default function CommissionTermsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
