import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { StudentTypesList } from './_components/StudentTypesList';

export const metadata = { title: "Types d'élèves — Pédagogie" };

interface PageProps {
  searchParams: Promise<{ school?: string }>;
}

export default async function StudentTypesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { school: requestedSchoolId } = await searchParams;

  const { data: ctxRaw } = await (supabase.rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)('get_user_school_context', {
    p_requested_school_id: requestedSchoolId ?? null,
    p_requested_year_id: null,
  });

  const ctx = ctxRaw as { current_school: { id: string; name: string } | null } | null;
  if (!ctx?.current_school) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <a href="/dashboard/pedagogy" className="text-xs text-slate-500 hover:text-orange-600">← Retour au Hub Rentrée</a>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Types d&apos;élèves</h1>
        <p className="text-sm text-slate-600">
          Définissez les catégories d&apos;élèves de votre école (affecté, non-affecté, etc.). Cette étape débloque : Frais.
        </p>
      </div>
      <StudentTypesList schoolId={ctx.current_school.id} />
    </div>
  );
}
