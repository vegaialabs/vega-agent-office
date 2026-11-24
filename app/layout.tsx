import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Vega Agent Office',description:'Workspace de coordinación y calidad de software'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="es" data-scroll-behavior="smooth"><body>{children}</body></html>}
