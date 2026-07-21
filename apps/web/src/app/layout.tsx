import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IA Agent",
  description: "VMO2/TCS Impact Assessment Estimation Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
