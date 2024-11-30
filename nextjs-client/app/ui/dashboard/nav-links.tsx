'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// 네비게이션 링크 목록
const links = [
  { name: 'Home', href: '/dashboard' },
  { name: 'gym', href: '/dashboard/gym' },
  { name: 'routine', href: '/dashboard/routine' },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              // 기본 클래스
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 text-gray-800 md:flex-none md:justify-start md:p-2 md:px-3',
              // 활성화된 링크에 대한 추가 클래스
              {
                'bg-sky-100 text-blue-600': isActive,
              }
            )}
          >
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
