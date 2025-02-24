// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Science Bowl Practice',
  description: 'Practice your Science Bowl questions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Additional head elements if needed */}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}