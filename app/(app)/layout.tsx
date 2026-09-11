import { TopNav, BottomNav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { RoleProvider } from '@/lib/RoleContext';
import { getNamaWarung } from '@/lib/getNamaWarung';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const nama = await getNamaWarung();
  return (
    <RoleProvider>
      <div className="flex min-h-screen flex-col bg-cream">
        <TopNav namaWarung={nama} />
        <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-hidden px-4 pb-28 pt-5 sm:px-6 md:pb-10">{children}</main>
        <Footer />
        <BottomNav />
      </div>
    </RoleProvider>
  );
}
