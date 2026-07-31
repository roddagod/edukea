'use client';

import { useState } from 'react';
import { Logo, Card } from '@edukea/ui';
import {
  Wallet,
  TrendingUp,
  BookOpen,
  Users,
  Play,
  ArrowRight,
  CheckCircle2,
  Building2,
  School,
  GraduationCap,
  Zap,
  ShieldCheck,
  Star,
  ChevronDown,
  Phone,
  Mail,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Mockup helpers                                                        */
/* ------------------------------------------------------------------ */

function BrowserMockup({ children, url }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-400" />
        <div className="h-3 w-3 rounded-full bg-yellow-400" />
        <div className="h-3 w-3 rounded-full bg-green-400" />
        {url && (
          <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
            {url}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PaymentMockup() {
  return (
    <BrowserMockup url="school.edukea.ci/paiements">
      <div className="space-y-3">
        <div className="rounded-lg bg-orange-50 p-3">
          <p className="text-xs font-semibold text-orange-900">
            Ventilation du paiement de 30 000 XAF — Konan Aya
          </p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-center justify-between text-xs text-orange-800">
              <span>Frais d&apos;inscription</span>
              <span className="font-mono font-semibold text-green-700">
                25 000 XAF <CheckCircle2 className="inline h-3 w-3" />
              </span>
            </li>
            <li className="flex items-center justify-between text-xs text-orange-800">
              <span>1re tranche</span>
              <span className="font-mono">5 000 XAF (reste 55 000)</span>
            </li>
          </ul>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg bg-green-50 p-2 text-center">
            <p className="text-xs text-green-700">Recu PDF</p>
            <p className="text-sm font-bold text-green-900">Genere</p>
          </div>
          <div className="flex-1 rounded-lg bg-blue-50 p-2 text-center">
            <p className="text-xs text-blue-700">Total encaisse</p>
            <p className="text-sm font-bold text-blue-900">8 320 000 XAF</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 p-2">
          <p className="text-xs text-slate-500">Alertes retards (3 familles)</p>
          <div className="mt-1 space-y-1">
            {['Touré Issa', 'Bamba Koffi', 'Yao Adjoua'].map((n) => (
              <div key={n} className="flex items-center justify-between text-xs">
                <span className="text-slate-700">{n}</span>
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">En retard</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserMockup>
  );
}

function SetupMockup() {
  const steps = [
    { label: 'Infos etablissement', done: true },
    { label: 'Niveaux & classes', done: true },
    { label: 'Matieres & coeff.', done: true },
    { label: 'Frais scolaires', done: true },
    { label: 'Import eleves', done: false },
    { label: 'Staff & roles', done: false },
    { label: 'Portail parent', done: false },
    { label: 'Lancer la rentree', done: false },
  ];
  return (
    <BrowserMockup url="school.edukea.ci/rentree">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">
          Hub Rentree 2026-2027 — 4 etapes completees sur 8
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {steps.map((s) => (
            <div
              key={s.label}
              className={`flex items-center gap-2 rounded-lg p-2 text-xs ${
                s.done ? 'bg-green-50 text-green-800' : 'bg-slate-50 text-slate-500'
              }`}
            >
              <CheckCircle2
                className={`h-3 w-3 shrink-0 ${s.done ? 'text-green-600' : 'text-slate-300'}`}
              />
              {s.label}
            </div>
          ))}
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div className="h-2 w-1/2 rounded-full bg-[#E97423]" />
        </div>
      </div>
    </BrowserMockup>
  );
}

function ParentMockup() {
  return (
    <BrowserMockup url="parent.edukea.ci">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEF1E9] text-sm font-bold text-[#E97423]">
            KA
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">Konan Ama</p>
            <p className="text-xs text-slate-500">3e A — Coll. Akonda Divo</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Moy. gen.', value: '14.2', color: 'text-green-700 bg-green-50' },
            { label: 'Absences', value: '2j', color: 'text-orange-700 bg-orange-50' },
            { label: 'Solde du', value: '55k', color: 'text-red-700 bg-red-50' },
          ].map((k) => (
            <div key={k.label} className={`rounded-lg p-2 text-center ${k.color}`}>
              <p className="text-sm font-bold">{k.value}</p>
              <p className="text-xs">{k.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600">Dernieres notes</p>
          {[
            { mat: 'Mathematiques', note: '16/20' },
            { mat: 'Francais', note: '13/20' },
            { mat: 'Anglais', note: '15/20' },
          ].map((n) => (
            <div key={n.mat} className="flex justify-between text-xs text-slate-700">
              <span>{n.mat}</span>
              <span className="font-semibold">{n.note}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserMockup>
  );
}

function HeroDashboardMockup() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-[#1D3A6B] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-white/40" />
          <span className="text-xs font-semibold text-white/80">school.edukea.ci</span>
        </div>
        <div className="h-6 w-6 rounded-full bg-orange-400 text-xs text-white flex items-center justify-center font-bold">
          JK
        </div>
      </div>
      {/* Sidebar + content */}
      <div className="flex h-52">
        <div className="w-28 border-r border-slate-100 bg-slate-50 p-2 space-y-1">
          {['Tableau de bord', 'Eleves', 'Paiements', 'Bulletins', 'Emploi du temps'].map(
            (item, i) => (
              <div
                key={item}
                className={`rounded px-2 py-1.5 text-xs ${
                  i === 0
                    ? 'bg-[#E97423] text-white font-semibold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {item}
              </div>
            ),
          )}
        </div>
        <div className="flex-1 p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-600">Tableau de bord — Rentree 2026-2027</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Eleves inscrits', value: '1 573', delta: '+12%' },
              { label: 'Encaisse (XAF)', value: '8 320 000', delta: '+8%' },
              { label: 'Taux recouvrement', value: '74%', delta: '' },
              { label: 'Absences du jour', value: '23', delta: '' },
            ].map((k) => (
              <div key={k.label} className="rounded-lg bg-slate-50 p-2">
                <p className="text-xs text-slate-500">{k.label}</p>
                <p className="text-sm font-bold text-slate-900">{k.value}</p>
                {k.delta && (
                  <p className="text-xs text-green-600">{k.delta} vs mois dernier</p>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-orange-50 p-2">
            <p className="text-xs font-semibold text-orange-900">3 familles en retard de paiement</p>
            <p className="text-xs text-orange-700">Cliquez pour envoyer une relance</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ Accordion                                                         */
/* ------------------------------------------------------------------ */

const FAQ_ITEMS = [
  {
    q: "Combien coute vraiment Edukea ?",
    a: "Nos tarifs commencent a 25 000 XAF/mois pour jusqu'a 200 eleves. Aucune commission sur les paiements, aucun cout cache. Vous pouvez arreter a tout moment.",
  },
  {
    q: "Combien de temps pour installer Edukea ?",
    a: "La configuration de base prend 30 minutes. Notre equipe vous accompagne gratuitement lors de l'onboarding. La plupart des directeurs sont operationnels le jour meme.",
  },
  {
    q: "Est-ce que ca marche sans internet ?",
    a: "Le portail web necessite une connexion. L'application parent fonctionne en mode hors-ligne partiel (consultation des dernieres donnees synchronisees). La synchronisation se fait automatiquement au retour en ligne.",
  },
  {
    q: "Puis-je importer mes donnees existantes ?",
    a: "Oui. Edukea supporte l'import Excel/CSV pour les listes d'eleves et les historiques de paiements. Notre equipe technique vous aide pour les migrations complexes.",
  },
  {
    q: "Comment sont securisees les donnees de mes eleves ?",
    a: "Toutes les donnees sont chiffrees (SSL/TLS) et hebergees sur des serveurs securises en Europe. Acces controle par roles (directeur, caissier, enseignant). Conformite RGPD.",
  },
  {
    q: "Quel support est fourni ?",
    a: "Support par WhatsApp et email du lundi au samedi, 7h-20h heure Abidjan. Le plan Illimite inclut un referent dedie et une hotline prioritaire.",
  },
  {
    q: "Peut-on gerer plusieurs etablissements ?",
    a: "Oui. La console Fondateur permet de superviser plusieurs etablissements depuis un seul compte : tableau de bord unifie, facturation centralisee, KPIs agregees.",
  },
  {
    q: "Y a-t-il un engagement de duree ?",
    a: "Non. Edukea est sans engagement. Vous etes facture mensuellement et pouvez resilier a tout moment depuis votre espace administrateur.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-slate-900 hover:text-[#E97423] transition-colors"
      >
        {q}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && <p className="pb-4 text-sm text-slate-600 leading-relaxed">{a}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing                                                               */
/* ------------------------------------------------------------------ */

const PLANS = [
  {
    name: 'Essentiel',
    price: '25 000',
    capacity: "Jusqu'a 200 eleves",
    popular: false,
    features: [
      'Inscriptions illimitees',
      'Gestion des paiements',
      'Bulletins PDF',
      'Espace parent inclus',
      'Support email',
    ],
  },
  {
    name: 'Professionnel',
    price: '50 000',
    capacity: "Jusqu'a 800 eleves",
    popular: true,
    features: [
      'Tout Essentiel +',
      'Multi-classes & niveaux',
      'Alertes retards automatiques',
      'Export comptable',
      'Support WhatsApp prioritaire',
    ],
  },
  {
    name: 'Illimite',
    price: '100 000',
    capacity: 'Eleves illimites',
    popular: false,
    features: [
      'Tout Professionnel +',
      'Plusieurs etablissements',
      'API & intégrations',
      'Referent dedie',
      'Hotline 7j/7',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── 1. HEADER ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo className="h-10 w-auto" />
          <nav className="hidden gap-8 md:flex">
            {[
              { href: '#features', label: 'Fonctionnalites' },
              { href: '#tarifs', label: 'Tarifs' },
              { href: '#portails', label: 'Portails' },
              { href: '#faq', label: 'Support' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-[#E97423]"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href="mailto:contact@edukea.ci"
            className="rounded-md bg-[#E97423] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c9621d]"
          >
            Demander une demo
          </a>
        </div>
      </header>

      {/* ── 2. HERO ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Left */}
          <div>
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[#FEF1E9] px-3 py-1 text-xs font-bold text-[#E97423]">
              Nouveau · Rentree 2026-2027
            </span>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-6xl font-display">
              La gestion de votre ecole vous prend{' '}
              <span className="text-[#E97423]">trop de temps&nbsp;?</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              Edukea automatise inscriptions, paiements et bulletins. En 30 minutes, votre
              ecole est en ligne. Fini les carnets papier.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="mailto:contact@edukea.ci"
                className="inline-flex items-center gap-2 rounded-md bg-[#E97423] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#c9621d]"
              >
                Demarrer mon essai gratuit <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                <Play className="h-4 w-4 fill-slate-700" /> Voir la demo en 2 min
              </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Sans carte bancaire
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Installation en 30 min
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Support en francais
              </span>
            </div>
          </div>
          {/* Right — dashboard mockup */}
          <div className="relative">
            <HeroDashboardMockup />
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-100 bg-white p-3 shadow-lg">
              <p className="text-xs text-slate-500">Taux recouvrement</p>
              <p className="text-2xl font-bold text-[#E97423]">74%</p>
              <p className="text-xs text-green-600">+8% ce mois</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TRUST BAR ───────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-medium text-slate-500">
            Deja 4 etablissements en Cote d&apos;Ivoire nous font confiance :
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { name: "Coll. Akonda Divo", icon: School },
              { name: "Coll. Akonda General", icon: Building2 },
              { name: "Groupe Scolaire Prim'Elite", icon: GraduationCap },
              { name: "Coll. Harmony N'douci", icon: School },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-slate-600">
                <s.icon className="h-4 w-4 text-[#E97423]" />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="mb-4 inline-flex items-center rounded-full border border-[#E97423] px-3 py-1 text-xs font-bold text-[#E97423]">
              Fonctionnalites
            </span>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl font-display">
              Ce qui rend Edukea unique
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Concu par des Ivoiriens, pour les ecoles africaines.
            </p>
          </div>

          {/* Feature 1 */}
          <div className="mt-16 grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <PaymentMockup />
            </div>
            <div className="order-1 md:order-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF1E9]">
                <Wallet className="h-6 w-6 text-[#E97423]" />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-900 font-display">
                Vos frais scolaires, ventiles automatiquement
              </h3>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Le parent paie 30 000 XAF, Edukea alloue automatiquement sur les echeances dues
                selon vos regles. Fini les carnets papier et les erreurs de caisse.
              </p>
              <ul className="mt-5 space-y-2">
                {['Ventilation FIFO automatique', 'Recus PDF instantanes', 'Alertes retards automatiques'].map(
                  (b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#E97423]" />
                      {b}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="mt-16 grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF1E9]">
                <Zap className="h-6 w-6 text-[#E97423]" />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-900 font-display">
                Configurez votre ecole en 30 minutes
              </h3>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Templates ivoiriens pre-remplis (Primaire, College, Lycee). Vos matieres et
                coefficients standards en 1 clic. Rentree prete le jour meme.
              </p>
              <ul className="mt-5 space-y-2">
                {['Templates Primaire / College / Lycee', 'Import de vos eleves (Excel/CSV)', 'Rentree fluide et guidee'].map(
                  (b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#E97423]" />
                      {b}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <SetupMockup />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="mt-16 grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <ParentMockup />
            </div>
            <div className="order-1 md:order-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF1E9]">
                <Users className="h-6 w-6 text-[#E97423]" />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-900 font-display">
                Un espace pour chaque parent
              </h3>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Les parents consultent notes, paiements, absences depuis leur telephone. Fini
                les cahiers de correspondance perdus et les appels manques.
              </p>
              <ul className="mt-5 space-y-2">
                {['Mobile-first (iOS & Android)', 'Notifications push en temps reel', 'Gestion multi-enfants'].map(
                  (b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#E97423]" />
                      {b}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. STATS BAR ───────────────────────────────────────────── */}
      <section className="bg-[#1D3A6B] py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 text-center text-white sm:grid-cols-4">
            {[
              { value: '4', label: 'Ecoles pilotes' },
              { value: '3 200+', label: 'Eleves geres' },
              { value: '12 min', label: 'Pour inscrire un eleve' },
              { value: '100%', label: 'Temps de fonctionnement' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-bold">{s.value}</p>
                <p className="mt-1 text-sm text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. TESTIMONIAL ─────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-[#E97423] text-[#E97423]" />
            ))}
          </div>
          <blockquote className="mt-6 text-xl font-medium leading-relaxed text-slate-900 md:text-2xl font-display">
            &ldquo;Avant Edukea, on passait 3 jours a preparer une rentree. Maintenant c&apos;est 3 heures.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1D3A6B] text-sm font-bold text-white">
              JK
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Jean KOFFI</p>
              <p className="text-sm text-slate-500">Directeur, Coll. Akonda Divo</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PRICING ─────────────────────────────────────────────── */}
      <section id="tarifs" className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="mb-4 inline-flex items-center rounded-full border border-[#E97423] px-3 py-1 text-xs font-bold text-[#E97423]">
              Tarifs
            </span>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl font-display">
              Des prix clairs, sans surprises
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Facture mensuellement. Sans engagement. Changez de plan a tout moment.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.popular
                    ? 'border-[#E97423] bg-white shadow-xl shadow-orange-100'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E97423] px-4 py-1 text-xs font-bold text-white">
                    POPULAIRE
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500">XAF/mois</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{plan.capacity}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E97423]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:contact@edukea.ci"
                  className={`mt-8 block rounded-md px-5 py-3 text-center text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-[#E97423] text-white hover:bg-[#c9621d]'
                      : 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  Choisir {plan.name}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Vous avez plus de 800 eleves ?{' '}
            <a href="mailto:contact@edukea.ci" className="font-semibold text-[#E97423] hover:underline">
              Contactez-nous pour un devis sur mesure.
            </a>
          </p>
        </div>
      </section>

      {/* ── 8. PORTAILS ────────────────────────────────────────────── */}
      <section id="portails" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="mb-4 inline-flex items-center rounded-full border border-[#1D3A6B] px-3 py-1 text-xs font-bold text-[#1D3A6B]">
              Portails
            </span>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl font-display">
              3 portails, 3 usages
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Choisissez votre espace selon votre role.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF1E9]">
                <School className="h-6 w-6 text-[#E97423]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Portail Ecole</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Pour : directeurs, caissiers, enseignants
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Inscriptions, paiements, bulletins, emploi du temps, communication. L&apos;outil
                quotidien de votre staff.
              </p>
              <a
                href="https://school.edukea.ci"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#E97423] transition-colors hover:text-[#c9621d]"
              >
                school.edukea.ci <ArrowRight className="h-3 w-3" />
              </a>
            </Card>
            <Card className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF1E9]">
                <Users className="h-6 w-6 text-[#E97423]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Espace Parent</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Pour : parents, tuteurs</p>
              </div>
              <p className="text-sm text-slate-600">
                Consultez notes, paiements, absences et communications de votre enfant depuis
                votre telephone.
              </p>
              <a
                href="https://parent.edukea.ci"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#E97423] transition-colors hover:text-[#c9621d]"
              >
                parent.edukea.ci <ArrowRight className="h-3 w-3" />
              </a>
            </Card>
            <Card className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EDF5]">
                <GraduationCap className="h-6 w-6 text-[#1D3A6B]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Console Fondateur</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Pour : fondateurs, groupes scolaires
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Gerez plusieurs etablissements, monitorez la plateforme, centralisez la
                facturation et les KPIs.
              </p>
              <a
                href="https://admin.edukea.ci"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#1D3A6B] transition-colors hover:text-[#152B52]"
              >
                admin.edukea.ci <ArrowRight className="h-3 w-3" />
              </a>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 9. FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <span className="mb-4 inline-flex items-center rounded-full border border-[#E97423] px-3 py-1 text-xs font-bold text-[#E97423]">
              FAQ
            </span>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl font-display">
              Questions frequentes
            </h2>
            <p className="mx-auto mt-3 text-slate-600">
              Tout ce que vous voulez savoir avant de commencer.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-6">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Autre question ?{' '}
            <a href="mailto:contact@edukea.ci" className="font-semibold text-[#E97423] hover:underline">
              Ecrivez-nous
            </a>{' '}
            — on repond en moins de 24h.
          </p>
        </div>
      </section>

      {/* ── 10. TRUST BADGES ───────────────────────────────────────── */}
      <section className="border-y border-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-500">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span>Connexion SSL chiffree</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span>Donnees securisees en Europe</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span>Conformite RGPD</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span>Sauvegarde quotidienne</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. CTA FINAL ──────────────────────────────────────────── */}
      <section className="bg-[#FEF1E9] py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl font-display">
            Pret a digitaliser votre ecole ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Demo personnalisee gratuite. Installation en 30 minutes. Sans engagement.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:contact@edukea.ci"
              className="inline-flex items-center gap-2 rounded-md bg-[#E97423] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[#c9621d]"
            >
              Reserver ma demo <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="tel:+2250700000000"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-colors hover:border-slate-400"
            >
              <Phone className="h-4 w-4" /> Nous appeler
            </a>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#E97423]" /> Sans carte bancaire
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#E97423]" /> Support dedie a l&apos;onboarding
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#E97423]" /> Import de vos donnees inclus
            </span>
          </div>
        </div>
      </section>

      {/* ── 12. FOOTER ─────────────────────────────────────────────── */}
      <footer id="contact" className="border-t border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <Logo className="h-12 w-auto" />
              <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                La plateforme de gestion scolaire pensee pour la Cote d&apos;Ivoire et l&apos;Afrique.
              </p>
              <p className="mt-3 text-xs text-slate-400">LAMBANO · Abidjan, Cote d&apos;Ivoire</p>
            </div>
            {/* Produit */}
            <div>
              <p className="text-sm font-semibold text-slate-900">Produit</p>
              <ul className="mt-3 space-y-2">
                {['Fonctionnalites', 'Tarifs', 'Mises a jour', 'Roadmap'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-500 hover:text-[#E97423] transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Portails */}
            <div>
              <p className="text-sm font-semibold text-slate-900">Portails</p>
              <ul className="mt-3 space-y-2">
                {[
                  { label: 'Portail Ecole', href: 'https://school.edukea.ci' },
                  { label: 'Espace Parent', href: 'https://parent.edukea.ci' },
                  { label: 'Console Fondateur', href: 'https://admin.edukea.ci' },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-slate-500 hover:text-[#E97423] transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Support & Legal */}
            <div>
              <p className="text-sm font-semibold text-slate-900">Support & Legal</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="mailto:contact@edukea.ci"
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#E97423] transition-colors"
                  >
                    <Mail className="h-3 w-3" /> contact@edukea.ci
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+2250700000000"
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#E97423] transition-colors"
                  >
                    <Phone className="h-3 w-3" /> +225 07 00 00 00 00
                  </a>
                </li>
                {['CGU', 'Politique de confidentialite', 'Mentions legales'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-500 hover:text-[#E97423] transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 md:flex-row">
            <p className="text-sm text-slate-400">© 2026 LAMBANO · Tous droits reserves · Edukea</p>
            <div className="flex gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-green-500" /> SSL
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-green-500" /> RGPD
              </span>
              <span>Serveurs en Europe</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
