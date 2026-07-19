import { redirect } from 'next/navigation';

// Le root ne rend rien : le middleware Supabase decidera si le user est
// authentifie (redirige vers /dashboard) ou non (redirige vers /auth/login).
// Fixe la boucle infinie : le root pointait sur /auth/login, le middleware
// renvoyait le user connecte vers /, boucle -> ERR_TOO_MANY_REDIRECTS.
export default function Home() {
  redirect('/dashboard');
}
