'use client';

export const dynamic = 'force-dynamic';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserCog,
  Coins,
  Building2,
  RefreshCw,
  ChevronDown,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import {
  AppShell,
  Topbar,
  Sidebar,
  SidebarWorkspace,
  SidebarSection,
  SidebarItem,
  SidebarDivider,
  SidebarUser,
  BottomNav,
  BottomNavItem,
  Avatar,
  Badge,
} from '@edukea/ui';
import {
  useSchoolContext,
  useSidebarBadges,
  useCurrentUserRole,
  computeInitials,
  labelForRole,
} from '@edukea/shared';
import { supabase } from '@edukea/shared';

function buildSections(studentsBadge: React.ReactNode | null, recoveryBadge: React.ReactNode | null) {
  return [
    {
      label: 'Pilotage',
      items: [
        { href: '/dashboard', label: 'Cockpit', icon: LayoutDashboard, badge: null as React.ReactNode | null },
      ],
    },
    {
      label: 'Scolarite',
      items: [
        { href: '/dashboard/students', label: 'Eleves', icon: Users, badge: studentsBadge },
        { href: '/dashboard/enrollment', label: 'Inscription', icon: UserPlus, badge: null as React.ReactNode | null },
        { href: '/dashboard/enrollment/passage', label: "Passage d'annee", icon: RefreshCw, badge: null as React.ReactNode | null },
      ],
    },
    {
      label: 'Pedagogie',
      items: [
        { href: '/dashboard/pedagogy', label: 'Rentree', icon: GraduationCap, badge: null as React.ReactNode | null },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/dashboard/recovery', label: 'Cockpit tresorerie', icon: Coins, badge: recoveryBadge },
      ],
    },
    {
      label: 'Administration',
      items: [
        { href: '/dashboard/users', label: 'Utilisateurs', icon: UserCog, badge: null as React.ReactNode | null },
      ],
    },
  ];
}

function buildBottomNav(studentsBadge: React.ReactNode | null, recoveryBadge: React.ReactNode | null) {
  return [
    { href: '/dashboard', label: 'Cockpit', icon: LayoutDashboard, badge: null as React.ReactNode | null },
    { href: '/dashboard/students', label: 'Eleves', icon: Users, badge: studentsBadge },
    { href: '/dashboard/enrollment', label: 'Inscription', icon: UserPlus, badge: null as React.ReactNode | null },
    { href: '/dashboard/recovery', label: 'Tresorerie', icon: Coins, badge: recoveryBadge },
    { href: '/dashboard/pedagogy', label: 'Rentree', icon: GraduationCap, badge: null as React.ReactNode | null },
  ];
}

interface SelectPillProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  showDot?: boolean;
  ariaLabel?: string;
}

// Native <select> stylise comme une ContextPill. Fonctionnel + mobile-friendly + a11y.
function SelectPill({ value, onChange, options, showDot, ariaLabel }: SelectPillProps) {
  return (
    <div className="relative inline-flex items-center">
      {showDot && <span className="pointer-events-none absolute left-3 h-1.5 w-1.5 rounded-full bg-brand-accent" />}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-full border border-line bg-white py-2 pr-9 text-body-sm font-semibold text-ink-2 outline-none transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          showDot ? 'pl-8' : 'pl-3.5'
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-ink-3" />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isBottomActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname === href || pathname.startsWith(href + '/');

  const requestedSchoolId = searchParams.get('school');
  const requestedYearId = searchParams.get('year');
  const { data: ctx } = useSchoolContext({ requestedSchoolId, requestedYearId });
  const { data: badges } = useSidebarBadges(ctx?.current_school?.id, ctx?.current_year?.id);
  const { data: me } = useCurrentUserRole();

  const displayName = me?.displayName ?? me?.email ?? 'Utilisateur';
  const initials = computeInitials(me?.displayName ?? null, me?.email ?? null);
  const roleLabel = me ? labelForRole(me.role) : '—';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const studentsBadge = badges && badges.students_enrolled_year > 0
    ? <Badge>{badges.students_enrolled_year}</Badge>
    : null;
  const recoveryBadge = badges && badges.recovery_students_count > 0
    ? <Badge tone="danger">{badges.recovery_students_count}</Badge>
    : null;
  const sections = buildSections(studentsBadge, recoveryBadge);
  const bottomNavItems = buildBottomNav(studentsBadge, recoveryBadge);

  const setParam = useCallback(
    (key: 'school' | 'year', value: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set(key, value);
      // Un changement d'ecole reset l'annee (car les annees sont school-specifiques)
      if (key === 'school') params.delete('year');
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const currentSchoolName = ctx?.current_school?.name ?? '—';
  const currentYearName = ctx?.current_year?.name ?? '—';

  const topbarRight = (
    <>
      {ctx?.is_superadmin && ctx.schools.length > 1 && (
        <SelectPill
          ariaLabel="Ecole"
          showDot
          value={ctx.current_school?.id ?? ''}
          onChange={(v) => setParam('school', v)}
          options={ctx.schools.map((s) => ({ value: s.id, label: s.name }))}
        />
      )}
      {ctx && ctx.years.length > 0 && (
        <SelectPill
          ariaLabel="Annee scolaire"
          value={ctx.current_year?.id ?? ''}
          onChange={(v) => setParam('year', v)}
          options={ctx.years.map((y) => ({ value: y.id, label: `Annee ${y.name}` }))}
        />
      )}
      <Avatar initials={initials} tone="accent" size="md" />
    </>
  );

  const topbar = <Topbar right={topbarRight} rightMobile={<Avatar initials={initials} tone="accent" size="sm" />} />;

  const sidebar = (
    <Sidebar
      workspace={
        <SidebarWorkspace
          icon={<Building2 className="h-[18px] w-[18px]" />}
          title={ctx?.is_superadmin ? 'Espace Lambano' : 'Espace direction'}
          sub={currentSchoolName}
        />
      }
      user={<SidebarUser initials={initials} name={displayName} role={ctx?.is_superadmin ? 'Superadmin' : roleLabel} />}
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
      <SidebarItem href="#" active={false} icon={<LogOut />} onClick={handleLogout}>
        Deconnexion
      </SidebarItem>
    </Sidebar>
  );

  const bottomNav = (
    <BottomNav>
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <BottomNavItem
            key={item.href}
            href={item.href}
            active={isBottomActive(item.href)}
            icon={<Icon className="h-5 w-5" />}
            label={item.label}
            badge={item.badge}
          />
        );
      })}
    </BottomNav>
  );

  return (
    <AppShell topbar={topbar} sidebar={sidebar} bottomNav={bottomNav}>
      {/* Bandeau selectors mobile : sous md uniquement, car les selectors du topbar sont caches */}
      {ctx && (
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          {ctx.is_superadmin && ctx.schools.length > 1 && (
            <SelectPill
              ariaLabel="Ecole"
              showDot
              value={ctx.current_school?.id ?? ''}
              onChange={(v) => setParam('school', v)}
              options={ctx.schools.map((s) => ({ value: s.id, label: s.name }))}
            />
          )}
          {ctx.years.length > 0 && (
            <SelectPill
              ariaLabel="Annee scolaire"
              value={ctx.current_year?.id ?? ''}
              onChange={(v) => setParam('year', v)}
              options={ctx.years.map((y) => ({ value: y.id, label: `Annee ${y.name}` }))}
            />
          )}
        </div>
      )}
      {children}
    </AppShell>
  );
}
