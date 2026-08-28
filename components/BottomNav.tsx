'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      <Link href="/" className={pathname === '/' ? 'active' : ''}>
        <div className="nav-icon">🏠</div>
        <span>Home</span>
      </Link>
      <Link href="/workers" className={pathname === '/workers' ? 'active' : ''}>
        <div className="nav-icon">👷</div>
        <span>Workers</span>
      </Link>
      <Link href="/attendance" aria-label="Quick Mark Attendance">
        <div className="fab" title="Quick Attendance">
          ✓
        </div>
      </Link>
      <Link href="/projects" className={pathname === '/projects' ? 'active' : ''}>
        <div className="nav-icon">🏗️</div>
        <span>Projects</span>
      </Link>
      <Link href="/more" className={pathname === '/more' ? 'active' : ''}>
        <div className="nav-icon">⋯</div>
        <span>More</span>
      </Link>
    </nav>
  );
}
