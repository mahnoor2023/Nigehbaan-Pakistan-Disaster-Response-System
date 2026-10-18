import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Nigehbaan | Pakistan Disaster Intelligence & Rescue",
  description: "Pakistan disaster intelligence prototype with live public weather forecasts and Karachi rescue coordination demo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="app-root min-h-full bg-slate-50 text-slate-900">
        <Nav />
        <div id="main-content" tabIndex={-1} className="app-content min-w-0">{children}</div>
      </body>
    </html>
  );
}
