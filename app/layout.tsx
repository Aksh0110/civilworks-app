import './globals.css';
import { ProjectProvider } from '@/lib/context/ProjectContext';

export const metadata = {
  title: 'CivilWorks — Construction Management',
  description: 'Simple mobile-first construction site management'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ProjectProvider>{children}</ProjectProvider>
      </body>
    </html>
  );
}

