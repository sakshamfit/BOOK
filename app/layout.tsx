import type { Metadata } from 'next';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/schibsted-grotesk/wght.css';
import '@fontsource-variable/caveat/wght.css';
import './globals.css';
import './folio.css';
export const metadata:Metadata={title:'Folio — Worlds within',description:'An independent bookshop for the endlessly curious. Discover beautifully considered books, turn a few pages, and find your next world.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
