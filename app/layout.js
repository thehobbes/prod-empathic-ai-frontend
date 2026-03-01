import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Empathic AI Therapy Frontend",
  description: "Frontend control room for voice, transcript, graph, and receipts",
};

/**
 * Render the root application layout for the frontend control room.
 *
 * Inputs:
 * - `children` (`React.ReactNode`): The active route subtree rendered by Next.js App Router.
 *
 * Output:
 * - A stable HTML shell with global fonts/styles applied.
 *
 * Purpose:
 * - Provide the top-level document/frame for all frontend routes.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}