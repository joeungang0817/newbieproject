import { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: {
    template: '%s | Healcome_KAIST',
    default: 'Healcome_KAIST',
  },
  description: 'The health routine management app for KAISTian.',
};

import '@/app/ui/global.css';
import {inter} from '@/app/ui/fonts';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
          {children}
      </body>
    </html>
  );
}