'use server';

import { createClient } from '@/lib/supabase-server';
import { getAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

interface CreateStaffArgs {
  email: string;
  password: string;
  role: 'manager' | 'director' | 'censor';
  displayName: string;
  schoolId: string;
}

export async function createStaffUser(
  args: CreateStaffArgs,
): Promise<{ ok: boolean; userId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Non authentifie' };

  // Verifier que le caller est superadmin ou manager de cette ecole
  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = !!adminProfile;
  if (!isAdmin) {
    const { data: staff } = await supabase
      .from('school_staff_profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const s = staff as { role?: string; school_id?: string } | null;
    if (!s || s.school_id !== args.schoolId || s.role !== 'manager') {
      return { ok: false, error: 'Acces refuse (manager de cette ecole requis)' };
    }
  }

  const adminClient = getAdminClient();

  // 1. Creer le compte Auth
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: args.email,
    password: args.password,
    email_confirm: true,
  });
  if (createErr) return { ok: false, error: `Creation compte echec : ${createErr.message}` };
  const newUserId = created.user?.id;
  if (!newUserId) return { ok: false, error: 'user_id manquant apres creation' };

  // 2. Inserer dans school_staff_profiles
  const { error: insertErr } = await adminClient.from('school_staff_profiles').insert({
    user_id: newUserId,
    school_id: args.schoolId,
    role: args.role,
    display_name: args.displayName,
  });
  if (insertErr) {
    // Rollback : supprimer le user auth cree
    await adminClient.auth.admin.deleteUser(newUserId);
    return { ok: false, error: `Profil echec : ${insertErr.message}` };
  }

  revalidatePath('/dashboard/users');
  return { ok: true, userId: newUserId };
}

interface UpdateStaffArgs {
  profileId: string;
  role?: 'manager' | 'director' | 'censor';
  displayName?: string;
}

export async function updateStaffUser(
  args: UpdateStaffArgs,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Non authentifie' };

  const adminClient = getAdminClient();
  const patch: Record<string, unknown> = {};
  if (args.role) patch.role = args.role;
  if (args.displayName !== undefined) patch.display_name = args.displayName;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await adminClient
    .from('school_staff_profiles')
    .update(patch)
    .eq('id', args.profileId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/users');
  return { ok: true };
}

export async function resetStaffPassword(args: {
  userId: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Non authentifie' };

  const adminClient = getAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(args.userId, {
    password: args.newPassword,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteStaffUser(args: {
  profileId: string;
  userId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Non authentifie' };

  const adminClient = getAdminClient();
  // Supprimer le profil en premier, puis le user auth
  const { error: delProfileErr } = await adminClient
    .from('school_staff_profiles')
    .delete()
    .eq('id', args.profileId);
  if (delProfileErr) return { ok: false, error: delProfileErr.message };

  const { error: delAuthErr } = await adminClient.auth.admin.deleteUser(args.userId);
  if (delAuthErr)
    return {
      ok: false,
      error: `Profil supprime mais auth echec : ${delAuthErr.message}`,
    };

  revalidatePath('/dashboard/users');
  return { ok: true };
}
