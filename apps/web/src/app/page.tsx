import { Logo, Card, Badge } from '@edukea/ui';
import {
  GraduationCap,
  School,
  Users,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Wallet,
  BookOpen,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo className="h-8 w-auto" />
          <nav className="hidden gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-[#E97423] transition-colors">
              Fonctionnalites
            </a>
            <a href="#portails" className="text-sm font-medium text-slate-600 hover:text-[#E97423] transition-colors">
              Portails
            </a>
            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-[#E97423] transition-colors">
              Contact
            </a>
          </nav>
          <a
            href="mailto:contact@edukea.ci"
            className="rounded-md bg-[#E97423] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9621d] transition-colors"
          >
            Demander une demo
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center md:py-32">
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-md bg-[#FEF1E0] px-2.5 py-1 text-xs font-bold text-[#E97423]">
          Nouveau · Rentree 2026-2027
        </span>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold text-slate-900 md:text-6xl font-display">
          La plateforme de gestion scolaire
          <br />
          <span className="text-[#E97423]">pensee pour l&apos;Afrique</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Inscriptions, paiements ventiles automatiquement, bulletins, communication parents.
          Tout en un.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="mailto:contact@edukea.ci"
            className="inline-flex items-center gap-2 rounded-md bg-[#E97423] px-6 py-3 text-base font-semibold text-white hover:bg-[#c9621d] transition-colors"
          >
            Demarrer gratuitement <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#portails"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:border-slate-400 transition-colors"
          >
            Voir les portails
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 bg-[#1D3A6B] py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 text-center text-white sm:grid-cols-4">
            <div>
              <p className="text-4xl font-bold">4</p>
              <p className="mt-1 text-sm text-white/70">Etablissements</p>
            </div>
            <div>
              <p className="text-4xl font-bold">3 100+</p>
              <p className="mt-1 text-sm text-white/70">Eleves</p>
            </div>
            <div>
              <p className="text-4xl font-bold">4 400+</p>
              <p className="mt-1 text-sm text-white/70">Familles</p>
            </div>
            <div>
              <p className="text-4xl font-bold">17 500+</p>
              <p className="mt-1 text-sm text-white/70">Paiements traites</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl font-display">
            Ce qui rend Edukea unique
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Concu par des Ivoiriens, pour les ecoles africaines.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Wallet,
                title: 'Paiements ventiles',
                text: 'Chaque versement est reparti automatiquement sur les echeances selon vos regles.',
              },
              {
                icon: TrendingUp,
                title: 'Recouvrement clair',
                text: 'Voyez qui doit combien, quand. Alertes retards, relances en un clic.',
              },
              {
                icon: BookOpen,
                title: 'Bulletins en 5 min',
                text: 'Trimestres, coefficients, appreciations, PDF. Vos rentrees pretes.',
              },
              {
                icon: Users,
                title: 'Espace parent',
                text: 'Les parents consultent notes, paiements, absences depuis leur telephone.',
              },
              {
                icon: CheckCircle2,
                title: 'Multi-ecoles',
                text: 'Gerez plusieurs etablissements depuis un seul cockpit fondateur.',
              },
              {
                icon: School,
                title: 'Configurable',
                text: "Adapte au systeme ivoirien : trimestres, matieres, coefficients, types d'eleves.",
              },
            ].map((f) => (
              <Card key={f.title} className="space-y-3">
                <f.icon className="h-8 w-8 text-[#E97423]" />
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portails */}
      <section id="portails" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl font-display">
          3 portails, 3 usages
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Choisissez votre espace selon votre role.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF1E0]">
              <School className="h-6 w-6 text-[#E97423]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Portail Ecole</h3>
            <p className="text-sm text-slate-600">
              Inscriptions, paiements, bulletins, communication. L&apos;outil quotidien du staff.
            </p>
            <a
              href="https://school.edukea.ci"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#E97423] hover:text-[#c9621d] transition-colors"
            >
              Acceder <ArrowRight className="h-3 w-3" />
            </a>
          </Card>
          <Card className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF1E0]">
              <Users className="h-6 w-6 text-[#E97423]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Espace Parent</h3>
            <p className="text-sm text-slate-600">
              Consultez notes, paiements, absences et communications de votre enfant.
            </p>
            <a
              href="https://parent.edukea.ci"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#E97423] hover:text-[#c9621d] transition-colors"
            >
              Acceder <ArrowRight className="h-3 w-3" />
            </a>
          </Card>
          <Card className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EDF5]">
              <GraduationCap className="h-6 w-6 text-[#1D3A6B]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Console Fondateur</h3>
            <p className="text-sm text-slate-600">
              Gerez plusieurs etablissements, monitorez la plateforme, facturation.
            </p>
            <a
              href="https://admin.edukea.ci"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#1D3A6B] hover:text-[#152B52] transition-colors"
            >
              Acceder <ArrowRight className="h-3 w-3" />
            </a>
          </Card>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#FEF1E0] py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl font-display">
            Pret a digitaliser votre ecole ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Demo personnalisee gratuite. Installation en 30 minutes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#E97423]" /> Mise en place rapide
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#E97423]" /> Support dedie
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#E97423]" /> Import des donnees existantes
            </span>
          </div>
          <a
            href="mailto:contact@edukea.ci"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#E97423] px-8 py-4 text-base font-semibold text-white hover:bg-[#c9621d] transition-colors"
          >
            Demander une demo <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-slate-100 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <Logo className="h-7 w-auto" />
            <span className="text-sm text-slate-500">© 2026 LAMBANO · Tous droits reserves</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="mailto:contact@edukea.ci" className="hover:text-[#E97423] transition-colors">
              contact@edukea.ci
            </a>
            <a href="#" className="hover:text-[#E97423] transition-colors">
              CGU
            </a>
            <a href="#" className="hover:text-[#E97423] transition-colors">
              Confidentialite
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
