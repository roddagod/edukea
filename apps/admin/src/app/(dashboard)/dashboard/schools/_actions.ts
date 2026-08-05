'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase-admin';

interface CreateSchoolAtomicArgs {
  // School
  name: string;
  displayName?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalAddress?: string;
  accreditationNumber?: string;
  countryCode: 'CI' | 'GA';
  currency: 'XOF' | 'XAF';
  // Year
  year: {
    name: string;         // ex: "2026-2027"
    dateStart: string;    // ISO date
    dateEnd: string;
    periodeType: 'trimestre' | 'semestre' | null;
  };
  // First manager (optional but recommended)
  manager?: {
    email: string;
    password: string;
    displayName: string;
  };
}

interface CreateSchoolAtomicResult {
  ok: boolean;
  schoolId?: string;
  yearId?: string;
  managerUserId?: string;
  error?: string;
}

// Verify caller is superadmin (via admin_profiles)
async function verifySuperadmin(): Promise<{ ok: boolean; userId?: string; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Non authentifié' };

  const { data: admin } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!admin) return { ok: false, error: 'Superadmin requis' };
  return { ok: true, userId: user.id };
}

export async function createSchoolAtomic(args: CreateSchoolAtomicArgs): Promise<CreateSchoolAtomicResult> {
  const auth = await verifySuperadmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const admin = getAdminClient();
  const schoolId = crypto.randomUUID();

  try {
    // 1. INSERT school (trigger on_school_created séed les student_types)
    const { error: schoolErr } = await (admin.from('schools') as any).insert({
      id: schoolId,
      name: args.name,
      display_name: args.displayName ?? args.name,
      email: args.email ?? null,
      phone: args.phone ?? null,
      address: args.address ?? null,
      postal_address: args.postalAddress ?? null,
      accreditation_number: args.accreditationNumber ?? null,
      country_code: args.countryCode,
      currency: args.currency,
    });
    if (schoolErr) throw new Error(`École : ${schoolErr.message}`);

    // 2. INSERT school_year
    const yearId = crypto.randomUUID();
    const { error: yearErr } = await (admin.from('school_years') as any).insert({
      id: yearId,
      school_id: schoolId,
      name: args.year.name,
      date_start: args.year.dateStart,
      date_end: args.year.dateEnd,
      periode_type: args.year.periodeType, // NULL si l'ecole veut definir plus tard
    });
    if (yearErr) {
      // Rollback école
      await (admin.from('schools') as any).delete().eq('id', schoolId);
      throw new Error(`Année : ${yearErr.message}`);
    }

    let managerUserId: string | undefined;
    let managerUserWasExisting = false;
    if (args.manager) {
      // 3. Create Auth user OU reutiliser si email deja existant (cas ecole
      //    supprimee/recreee, ou manager qui gere plusieurs ecoles)
      const { data: created, error: authErr } = await admin.auth.admin.createUser({
        email: args.manager.email,
        password: args.manager.password,
        email_confirm: true,
      });

      if (authErr) {
        // Email deja pris ? tenter de recuperer l'user_id existant
        const isEmailExists = authErr.message?.toLowerCase().includes('already') || authErr.message?.toLowerCase().includes('registered');
        if (isEmailExists) {
          // Chercher le user par email (pas d'API directe, on utilise listUsers avec filter)
          const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
          const existing = usersList?.users?.find((u) => u.email?.toLowerCase() === args.manager!.email.toLowerCase());
          if (!existing) {
            await (admin.from('school_years') as any).delete().eq('id', yearId);
            await (admin.from('schools') as any).delete().eq('id', schoolId);
            throw new Error(`Auth manager : email déjà pris mais user introuvable. ${authErr.message}`);
          }
          managerUserId = existing.id;
          managerUserWasExisting = true;
        } else {
          await (admin.from('school_years') as any).delete().eq('id', yearId);
          await (admin.from('schools') as any).delete().eq('id', schoolId);
          throw new Error(`Auth manager : ${authErr.message}`);
        }
      } else if (!created.user?.id) {
        await (admin.from('school_years') as any).delete().eq('id', yearId);
        await (admin.from('schools') as any).delete().eq('id', schoolId);
        throw new Error(`Auth manager : user_id manquant apres creation`);
      } else {
        managerUserId = created.user.id;
      }

      // 4. Insert school_staff_profiles (nouvelle relation user <-> ecole)
      const { error: profileErr } = await (admin.from('school_staff_profiles') as any).insert({
        user_id: managerUserId,
        school_id: schoolId,
        role: 'manager',
        display_name: args.manager.displayName,
      });
      if (profileErr) {
        // Rollback : ne PAS deleteUser si l'user preexistait (aurait d'autres ecoles)
        if (!managerUserWasExisting && managerUserId) {
          await admin.auth.admin.deleteUser(managerUserId);
        }
        await (admin.from('school_years') as any).delete().eq('id', yearId);
        await (admin.from('schools') as any).delete().eq('id', schoolId);
        throw new Error(`Profil manager : ${profileErr.message}`);
      }
    }

    revalidatePath('/dashboard/schools');
    return { ok: true, schoolId, yearId, managerUserId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' };
  }
}
