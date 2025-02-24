// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Sci-Buddy",
  description: "Audio-based questions for a realistic Science Bowl practice experience.",
  openGraph: {
    title: "Sci-Buddy",
    description: "Audio-based questions for a realistic Science Bowl practice experience.",
    url: "https://www.sci-buddy.com/", // Replace with your actual domain
    type: "website",
    images: [
      {
        url: "/public/sci-buddy.png", 
        width: 1200,
        height: 630,
        alt: "Sci-Buddy Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sci-Buddy",
    description: "Audio-based questions for a realistic Science Bowl practice experience.",
    images: ["/public/sci-buddy.png"], 
  },
  robots: "index, follow", 
  viewport: "width=device-width, initial-scale=1", 
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