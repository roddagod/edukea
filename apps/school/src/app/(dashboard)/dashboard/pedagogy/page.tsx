import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { PedagogyChecklist } from './_components/PedagogyChecklist';

export const metadata = {
  title: 'Rentree pedagogique — Edukea',
};

export default async function PedagogyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: staffRaw } = await supabase
    .from('school_staff_profiles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  const staff = staffRaw as { school_id: string; role: string } | null;

  if (!staff) redirect('/auth/no-access');
  if (staff.role !== 'manager') redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Rentree pedagogique</h1>
        <p className="text-sm text-slate-600">Point de depart pour parametrer votre annee scolaire</p>
      </div>
      <PedagogyChecklist schoolId={staff.school_id} />
    </div>
  );
}
