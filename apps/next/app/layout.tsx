import { ReactNode } from "react";
import "./globals.css";
import { GlobalIncomingCall } from "@zola/app/components/GlobalIncomingCall.web";

export const metadata = {
  title: "Zola Web",
  description: "Next.js shell that consumes @zola/app"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GlobalIncomingCall />
        {children}
      </body>
    </html>
  );
}

