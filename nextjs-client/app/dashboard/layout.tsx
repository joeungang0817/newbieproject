import SideNav from '@/app/ui/dashboard/sidenav';

export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-gray-100">
      <div className="w-full flex-none md:w-56"> {/* 사이드바 너비를 56으로 줄임 */}
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}
