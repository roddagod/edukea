'use client';

import { useState } from 'react';
import { Logo } from '@edukea/ui';
import { ArrowRight, Menu, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Header                                                               */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: 'Solutions', href: '#solutions' },
  { label: 'Écoles', href: '#ecoles' },
  { label: 'Enseignants', href: '#enseignants' },
  { label: 'Parents', href: '#parents' },
  { label: 'Ressources', href: '#ressources' },
  { label: 'À propos', href: '#apropos' },
];

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a href="/" aria-label="Edukea — Accueil">
          <img src="/logo-color.png" alt="Edukea" className="h-10 w-auto" />
        </a>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-700 transition-colors hover:text-[#1D3A6B]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right desktop */}
        <div className="hidden items-center gap-4 lg:flex">
          <span className="text-sm font-medium text-slate-500 cursor-default select-none">FR</span>
          <span className="text-slate-300">|</span>
          <span className="text-sm font-medium text-slate-400 cursor-default select-none">EN</span>
          <a
            href="mailto:contact@edukea.ci"
            className="border border-[#1D3A6B] px-5 py-2 text-sm font-semibold text-[#1D3A6B] transition-colors hover:bg-[#1D3A6B] hover:text-white"
          >
            Demander une démo
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="p-2 text-slate-700 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-700"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <a
              href="mailto:contact@edukea.ci"
              className="mt-2 border border-[#1D3A6B] px-5 py-2 text-center text-sm font-semibold text-[#1D3A6B]"
            >
              Demander une démo
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      {/* ── 1. HERO PHOTO PLEINE LARGEUR ─────────────────────────────── */}
      <section className="relative min-h-[600px] lg:min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Photo de fond */}
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=2000&q=80"
          alt="Salle de classe"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center text-white">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/80 mb-6">
            Plateforme éducative numérique
          </p>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Révélez le potentiel<br className="hidden sm:block" /> de votre école
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/85 leading-relaxed md:text-xl">
            La solution complète de gestion scolaire pensée pour la Côte d&apos;Ivoire&nbsp;:
            inscriptions, paiements, bulletins, communication parents.
          </p>

          {/* 4 CTA portails */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {[
              { label: 'Fondateurs', href: '/fondateurs' },
              { label: 'Écoles', href: '/ecoles' },
              { label: 'Enseignants', href: '/enseignants' },
              { label: 'Parents', href: '/parents' },
            ].map((cta) => (
              <a
                key={cta.href}
                href={cta.href}
                className="border border-white/40 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-[#1D3A6B]"
              >
                {cta.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. NOS SOLUTIONS ────────────────────────────────────────── */}
      <section id="solutions" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#E97423] mb-4">
            Solutions
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#1D3A6B] md:text-5xl">
            Une plateforme, trois espaces dédiés
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <div className="group">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"
                  alt="Portail École"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-semibold text-[#1D3A6B] md:text-2xl">Portail École</h3>
                <p className="mt-3 text-base text-slate-600 leading-relaxed">
                  Directeurs, censeurs, secrétaires et enseignants pilotent leur établissement au quotidien.
                </p>
                <a
                  href="https://edukea-school.vercel.app"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D3A6B] hover:text-[#E97423] transition-colors"
                >
                  edukea-school.vercel.app <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&q=80"
                  alt="Espace Parent"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-semibold text-[#1D3A6B] md:text-2xl">Espace Parent</h3>
                <p className="mt-3 text-base text-slate-600 leading-relaxed">
                  Notes, paiements, absences, communication. Un espace dédié pour chaque famille.
                </p>
                <a
                  href="https://parent.edukea.ci"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D3A6B] hover:text-[#E97423] transition-colors"
                >
                  parent.edukea.ci <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80"
                  alt="Administration Edukea"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-semibold text-[#1D3A6B] md:text-2xl">Administration Edukea</h3>
                <p className="mt-3 text-base text-slate-600 leading-relaxed">
                  Supervision multi-écoles pour fondateurs et administrateurs de groupes scolaires.
                </p>
                <a
                  href="https://edukea-admin.vercel.app"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D3A6B] hover:text-[#E97423] transition-colors"
                >
                  edukea-admin.vercel.app <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CHIFFRES CLÉS ────────────────────────────────────────── */}
      <section className="border-t border-slate-200 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#E97423] mb-4">
            Edukea en chiffres
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#1D3A6B] md:text-5xl">
            L&apos;éducation ivoirienne à l&apos;ère numérique
          </h2>

          <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: '4', label: 'Établissements pilotes' },
              { value: '3 200+', label: 'Élèves gérés' },
              { value: '12 min', label: 'Pour inscrire un élève' },
              { value: '100%', label: 'Uptime plateforme' },
            ].map((s) => (
              <div key={s.label} className="border-l-2 border-[#E97423] pl-6">
                <p className="text-6xl font-bold text-[#1D3A6B]">{s.value}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. ACTUALITÉS ───────────────────────────────────────────── */}
      <section className="bg-[#F7F8FB] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-12">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#E97423] mb-4">
                Actualités
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-[#1D3A6B] md:text-5xl">
                Dernières nouvelles
              </h2>
            </div>
            <a
              href="/actualites"
              className="text-sm font-semibold text-[#1D3A6B] hover:text-[#E97423] transition-colors shrink-0"
            >
              Voir toutes les actualités →
            </a>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                photo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
                date: '12 juillet 2026',
                title: 'Rentrée 2026 : 4 nouvelles écoles rejoignent Edukea',
                excerpt:
                  'Un quatrième établissement ivoirien rejoint le réseau Edukea à l\'occasion de la rentrée 2026-2027, portant notre couverture à Abidjan, Divo et N\'douci.',
              },
              {
                photo: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
                date: '28 juin 2026',
                title: 'Nouvelle fonctionnalité : Bulletins numériques automatisés',
                excerpt:
                  'Le module de génération automatique de bulletins PDF est désormais disponible pour tous les établissements. Calcul des moyennes, rangs et appréciations en un clic.',
              },
              {
                photo: 'https://images.unsplash.com/photo-1494883759339-0b042055a4ee?w=800&q=80',
                date: '15 juin 2026',
                title: 'Interview : Le Collège Akonda Divo témoigne',
                excerpt:
                  'Jean KOFFI, directeur du Collège Akonda Divo, revient sur 8 mois d\'utilisation d\'Edukea et les bénéfices concrets pour son équipe et les familles.',
              },
            ].map((article) => (
              <article key={article.title} className="group bg-white">
                <div className="aspect-[3/2] overflow-hidden">
                  <img
                    src={article.photo}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                    {article.date}
                  </p>
                  <h3 className="text-lg font-semibold text-[#1D3A6B] leading-snug">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{article.excerpt}</p>
                  <a
                    href="/actualites"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D3A6B] hover:text-[#E97423] transition-colors"
                  >
                    Lire l&apos;article <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. ILS NOUS FONT CONFIANCE ──────────────────────────────── */}
      <section id="ecoles" className="border-t border-slate-200 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#E97423] mb-4">
            Ils nous font confiance
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#1D3A6B] md:text-5xl mb-16">
            Écoles pilotes
          </h2>

          <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
            {[
              { name: 'Collège Akonda Divo', location: 'Divo, Côte d\'Ivoire' },
              { name: 'Collège Akonda Général', location: 'Divo, Côte d\'Ivoire' },
              { name: 'Groupe Scolaire Prim\'Elite', location: 'Abidjan' },
              { name: 'Collège Harmony N\'douci', location: 'N\'douci' },
            ].map((school) => (
              <div key={school.name} className="bg-white px-8 py-10">
                <p className="text-base font-semibold text-[#1D3A6B]">{school.name}</p>
                <p className="mt-1 text-sm text-slate-500">{school.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. TESTIMONIAL PLEINE LARGEUR ───────────────────────────── */}
      <section className="bg-[#1D3A6B] py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center text-white">
          <svg
            className="mx-auto mb-8 h-10 w-10 text-[#E97423]"
            fill="currentColor"
            viewBox="0 0 32 32"
            aria-hidden="true"
          >
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
          <blockquote className="text-2xl font-semibold leading-relaxed md:text-3xl lg:text-4xl">
            Avant Edukea, on passait 3 jours à préparer une rentrée. Maintenant c&apos;est 3 heures.
          </blockquote>
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
              JK
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Jean KOFFI</p>
              <p className="text-sm text-white/60">Directeur, Collège Akonda Divo</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. RESSOURCES ───────────────────────────────────────────── */}
      <section id="ressources" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#E97423] mb-4">
            Ressources
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#1D3A6B] md:text-5xl mb-12">
            Documentation & Support
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Guide d\'installation',
                desc: 'Configurez votre école en 30 minutes grâce à notre guide pas-à-pas.',
                link: 'Télécharger le PDF',
                href: '#',
              },
              {
                title: 'Support technique',
                desc: 'Notre équipe est joignable 7j/7 pour vous accompagner à chaque étape.',
                link: 'Nous contacter',
                href: 'mailto:contact@edukea.ci',
              },
              {
                title: 'Formations',
                desc: 'Sessions de formation gratuites pour votre staff, en présentiel ou en ligne.',
                link: 'S\'inscrire',
                href: 'mailto:contact@edukea.ci',
              },
            ].map((card) => (
              <div key={card.title} className="border border-slate-200 p-8">
                <h3 className="text-xl font-semibold text-[#1D3A6B]">{card.title}</h3>
                <p className="mt-3 text-base text-slate-600 leading-relaxed">{card.desc}</p>
                <a
                  href={card.href}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D3A6B] hover:text-[#E97423] transition-colors"
                >
                  {card.link} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CTA FINAL ────────────────────────────────────────────── */}
      <section className="border-y border-[#1D3A6B]/20 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1D3A6B] md:text-4xl">
            Prêt à digitaliser votre école&nbsp;?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
            Démo personnalisée gratuite. Installation en 30 minutes. Sans engagement.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:contact@edukea.ci"
              className="bg-[#1D3A6B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#152C52]"
            >
              Demander une démo
            </a>
            <a
              href="tel:+2250700000000"
              className="border border-[#1D3A6B] px-6 py-3 text-sm font-semibold text-[#1D3A6B] transition-colors hover:bg-[#1D3A6B] hover:text-white"
            >
              Nous appeler
            </a>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-[#0F1E3D] py-16 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
            {/* Col 1 — Brand */}
            <div className="lg:col-span-1">
              <img src="/logo-white.png" alt="Edukea" className="h-12 w-auto" />
              <p className="mt-4 text-sm text-white/50 leading-relaxed">
                Abidjan, Côte d&apos;Ivoire
              </p>
              <a
                href="mailto:contact@edukea.ci"
                className="mt-1 block text-sm text-white/50 hover:text-white transition-colors"
              >
                contact@edukea.ci
              </a>
            </div>

            {/* Col 2 — Solutions */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                Solutions
              </p>
              <ul className="space-y-3">
                {['Fondateurs', 'Écoles', 'Enseignants', 'Parents'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Portails */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                Portails
              </p>
              <ul className="space-y-3">
                {[
                  { label: 'edukea-school.vercel.app', href: 'https://edukea-school.vercel.app' },
                  { label: 'parent.edukea.ci', href: 'https://parent.edukea.ci' },
                  { label: 'edukea-admin.vercel.app', href: 'https://edukea-admin.vercel.app' },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Ressources */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                Ressources
              </p>
              <ul className="space-y-3">
                {['Documentation', 'Support', 'Formations', 'Blog'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 5 — Légal */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                Légal
              </p>
              <ul className="space-y-3">
                {['Mentions légales', 'CGU', 'Politique de confidentialité', 'Accessibilité'].map(
                  (l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        {l}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-sm text-white/40">
              © 2026 Edukea. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm text-white/40">
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
