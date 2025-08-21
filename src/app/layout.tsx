import type {Metadata} from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/app-context';
import { Toaster } from "@/components/ui/toaster";
import BottomNavbar from '@/components/layout/bottom-navbar';

export const metadata: Metadata = {
  title: 'ProHappyAssignments',
  description: 'Streamline Your Success with ProHappyAssignments',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          {children}
          <BottomNavbar />
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
