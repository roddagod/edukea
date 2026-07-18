import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Shield,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: BarChart3,
    title: 'Suivi des notes',
    description: 'Consultez les notes, les moyennes et les bulletins scolaires en temps reel.',
  },
  {
    icon: CreditCard,
    title: 'Gestion des paiements',
    description: 'Suivez les echeanciers de frais scolaires et l\'historique des versements.',
  },
  {
    icon: MessageSquare,
    title: 'Messagerie',
    description: 'Communiquez directement avec les enseignants et l\'administration.',
  },
  {
    icon: Calendar,
    title: 'Emploi du temps',
    description: 'Consultez l\'emploi du temps et les absences de vos enfants.',
  },
  {
    icon: Users,
    title: 'Multi-etablissements',
    description: 'Gerez plusieurs etablissements depuis une seule plateforme SaaS.',
  },
  {
    icon: Shield,
    title: 'Securise',
    description: 'Donnees protegees avec isolation par etablissement et controle d\'acces.',
  },
];

const portals = [
  {
    icon: GraduationCap,
    title: 'Espace Parent',
    description: 'Suivez la scolarite de vos enfants : notes, paiements, messagerie avec les enseignants.',
    href: '/parent',
    color: 'bg-primary',
    lightColor: 'bg-primary-light',
    textColor: 'text-primary',
  },
  {
    icon: Building2,
    title: 'Espace Etablissement',
    description: 'Gerez votre etablissement : eleves, notes, paiements, emplois du temps, annonces.',
    href: '/school',
    color: 'bg-blue-600',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    icon: Shield,
    title: 'Administration',
    description: 'Gerez la plateforme : etablissements, abonnements, utilisateurs, configuration.',
    href: '/admin',
    color: 'bg-gray-900',
    lightColor: 'bg-gray-100',
    textColor: 'text-gray-900',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Edukea</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Fonctionnalites</a>
            <a href="#portals" className="text-sm text-muted-foreground hover:text-foreground">Espaces</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-light via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              La gestion scolaire
              <span className="text-primary"> simplifiee</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Edukea connecte parents, enseignants et administrateurs sur une plateforme unique.
              Suivi des notes, paiements, messagerie et bien plus.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="px-8 text-base" asChild>
                <a href="#portals">
                  Commencer <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="px-8 text-base" asChild>
                <a href="#features">Decouvrir</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Tout ce dont vous avez besoin</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Une plateforme complete pour la gestion quotidienne de votre etablissement scolaire.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="bg-gray-50/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Accedez a votre espace</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Choisissez votre portail selon votre role.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {portals.map((portal) => (
              <Card key={portal.title} className="group overflow-hidden transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${portal.color}`}>
                    <portal.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{portal.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{portal.description}</p>
                  <Button className="mt-6 w-full group-hover:shadow-sm" variant="outline" asChild>
                    <Link href={portal.href}>
                      Acceder <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 text-center text-white sm:grid-cols-4">
            <div>
              <p className="text-4xl font-bold">4</p>
              <p className="mt-1 text-sm text-white/80">Etablissements</p>
            </div>
            <div>
              <p className="text-4xl font-bold">3 100+</p>
              <p className="mt-1 text-sm text-white/80">Eleves</p>
            </div>
            <div>
              <p className="text-4xl font-bold">4 400+</p>
              <p className="mt-1 text-sm text-white/80">Familles</p>
            </div>
            <div>
              <p className="text-4xl font-bold">17 500+</p>
              <p className="mt-1 text-sm text-white/80">Paiements traites</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Pret a digitaliser votre etablissement ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Rejoignez les etablissements qui font confiance a Edukea pour simplifier leur gestion quotidienne.
          </p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Mise en place rapide
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Support dedie
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Import des donnees existantes
            </div>
          </div>
          <Button size="lg" className="mt-8 px-8 text-base">
            Contactez-nous
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">Edukea</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} LAMBANO. Tous droits reserves.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
