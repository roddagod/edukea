'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserPlus,
  Coins,
  CreditCard,
  Megaphone,
  Settings,
  Building2,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  AppShell,
  Topbar,
  ContextPill,
  Sidebar,
  SidebarWorkspace,
  SidebarSection,
  SidebarItem,
  SidebarDivider,
  SidebarUser,
  Avatar,
  Badge,
} from '@edukea/ui';

const sections = [
  {
    label: 'Pilotage',
    items: [
      { href: '/dashboard', label: 'Cockpit', icon: LayoutDashboard, badge: null as React.ReactNode | null },
      { href: '/dashboard/reports', label: 'Rapports', icon: BarChart3, badge: null as React.ReactNode | null },
    ],
  },
  {
    label: 'Scolarite',
    items: [
      { href: '/dashboard/students', label: 'Eleves', icon: Users, badge: <Badge>1573</Badge> as React.ReactNode | null },
      { href: '/dashboard/enrollment', label: 'Inscription', icon: UserPlus, badge: null as React.ReactNode | null },
      { href: '/dashboard/reenrollment', label: 'Reinscription', icon: RefreshCw, badge: null as React.ReactNode | null },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/recovery', label: 'Recouvrement', icon: Coins, badge: <Badge tone="danger">12</Badge> as React.ReactNode | null },
      { href: '/dashboard/payments', label: 'Versements', icon: CreditCard, badge: null as React.ReactNode | null },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/dashboard/announcements', label: 'Annonces', icon: Megaphone, badge: null as React.ReactNode | null },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const topbar = (
    <Topbar
      right={
        <>
          <ContextPill showDot>Annee 2025-2026</ContextPill>
          <ContextPill>General</ContextPill>
          <Avatar initials="JA" tone="accent" size="md" />
        </>
      }
    />
  );

  const sidebar = (
    <Sidebar
      workspace={
        <SidebarWorkspace
          icon={<Building2 className="h-[18px] w-[18px]" />}
          title="Espace direction"
          sub="College Akonda-Diarra"
        />
      }
      user={<SidebarUser initials="JA" name="Joel Akoun" role="Directeur general" />}
    >
      {sections.map((section) => (
        <div key={section.label}>
          <SidebarSection>{section.label}</SidebarSection>
          {section.items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarItem
                key={item.href}
                href={item.href}
                active={isActive(item.href)}
                icon={<Icon />}
                badge={item.badge}
              >
                {item.label}
              </SidebarItem>
            );
          })}
        </div>
      ))}
      <div className="flex-1" />
      <SidebarDivider />
      <SidebarItem href="/dashboard/settings" active={isActive('/dashboard/settings')} icon={<Settings />}>
        Parametrage
      </SidebarItem>
    </Sidebar>
  );

  return (
    <AppShell topbar={topbar} sidebar={sidebar}>
      {children}
    </AppShell>
  );
}
