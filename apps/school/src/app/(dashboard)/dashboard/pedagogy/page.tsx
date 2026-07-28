import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { PedagogyChecklist } from './_components/PedagogyChecklist';

export const metadata = {
  title: 'Rentree pedagogique — Edukea',
};

interface SchoolContext {
  is_superadmin: boolean;
  schools: Array<{ id: string; name: string }>;
  current_school: { id: string; name: string } | null;
}

interface PageProps {
  searchParams: Promise<{ school?: string }>;
}

export default async function PedagogyPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { school: requestedSchoolId } = await searchParams;

  const { data: ctxRaw, error: ctxError } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)('get_user_school_context', {
    p_requested_school_id: requestedSchoolId ?? null,
    p_requested_year_id: null,
  });

  if (ctxError || !ctxRaw) redirect('/dashboard');

  const ctx = ctxRaw as unknown as SchoolContext;
  if (!ctx.current_school) redirect('/dashboard');

  const schoolId = ctx.current_school.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Rentree pedagogique</h1>
          {ctx.is_superadmin && (
            <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              Superadmin · {ctx.current_school.name}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600">Point de depart pour parametrer votre annee scolaire</p>
        {ctx.is_superadmin && ctx.schools.length > 1 && (
          <SchoolSwitcher schools={ctx.schools} currentId={schoolId} />
        )}
      </div>
      <PedagogyChecklist schoolId={schoolId} />
    </div>
  );
}

function SchoolSwitcher({ schools, currentId }: { schools: Array<{ id: string; name: string }>; currentId: string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {schools.map((s) => (
        <a
          key={s.id}
          href={`/dashboard/pedagogy?school=${s.id}`}
          className={
            s.id === currentId
              ? 'rounded-md bg-orange-600 px-2.5 py-1 text-xs font-medium text-white'
              : 'rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200'
          }
        >
          {s.name}
        </a>
      ))}
    </div>
  );
}
