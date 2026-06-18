import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerCrafter AI — FuturePath Careers",
  description:
    "Generative AI career copilot: tailored resumes, cover letters, mock interviews, skill paths, and networking messages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background text-black antialiased">
        {children}
      </body>
    </html>
  );
}
