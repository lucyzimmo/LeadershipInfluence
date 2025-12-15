import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sway Leader Influence Dashboard",
  description: "Transform political support data into actionable strategic intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
