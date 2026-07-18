'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  ClipboardList,
  Calendar,
  Megaphone,
  Settings,
  Building2,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Eleves', icon: Users },
  { href: '/dashboard/grades', label: 'Notes & Bulletins', icon: GraduationCap },
  { href: '/dashboard/payments', label: 'Paiements', icon: CreditCard },
  { href: '/dashboard/attendance', label: 'Absences', icon: ClipboardList },
  { href: '/dashboard/timetable', label: 'Emploi du temps', icon: Calendar },
  { href: '/dashboard/announcements', label: 'Annonces', icon: Megaphone },
  { href: '/dashboard/settings', label: 'Parametres', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold">Edukea</span>
            <p className="text-xs text-muted-foreground">Etablissement</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Deconnexion
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50/50 p-6">
        {children}
      </main>
    </div>
  );
}
