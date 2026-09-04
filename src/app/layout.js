import { Montserrat_Alternates, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const montAlt = Montserrat_Alternates({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata = {
  title: 'Claims Register',
  description: 'Mini claims register — track claims and payments',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montAlt.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}