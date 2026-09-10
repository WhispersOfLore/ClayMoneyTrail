import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const geistSans=Geist({variable:'--font-geist-sans',subsets:['latin']});
const geistMono=Geist_Mono({variable:'--font-geist-mono',subsets:['latin']});
export const metadata:Metadata={title:'Clay County Money Trail',description:'A source-first civic dashboard for following Clay County, Florida public money.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>}
