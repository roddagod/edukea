import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase-server';
import { UsersListView } from './_components/UsersListView';

export const metadata = { title: 'Utilisateurs' };

interface PageProps {
  searchParams: Promise<{ school?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { school: requestedSchoolId } = await searchParams;

  const { data: ctxRaw } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>
  )('get_user_school_context', {
    p_requested_school_id: requestedSchoolId ?? null,
    p_requested_year_id: null,
  });

  const ctx = ctxRaw as { current_school: { id: string; name: string } | null } | null;
  if (!ctx?.current_school) redirect('/dashboard');

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Utilisateurs</h1>
        <p className="text-sm text-slate-600">
          Gerez les comptes staff de {ctx.current_school.name}.
        </p>
      </div>
      <UsersListView schoolId={ctx.current_school.id} />
    </div>
  );
}
