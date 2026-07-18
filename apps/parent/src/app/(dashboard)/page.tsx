'use client';

import {
  GraduationCap,
  CreditCard,
  MessageSquare,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-state';
import { useSelectedChild } from '@/components/layout/child-selector';
import { usePayments, useGrades, useAuth, formatCurrency, formatShortDate } from '@edukea/shared';

export default function DashboardPage() {
  const { selectedChild, isLoading: childLoading } = useSelectedChild();
  const { profile } = useAuth();
  const { data: payments, isLoading: paymentsLoading } = usePayments(selectedChild?.id);
  const { data: grades, isLoading: gradesLoading } = useGrades(selectedChild?.id);

  if (childLoading) return <LoadingPage />;

  // Build display name from parent's family records
  const displayName = profile?.father
    ? `${profile.father.firstname || ''} ${profile.father.lastname || ''}`.trim()
    : profile?.mother
      ? `${profile.mother.firstname || ''} ${profile.mother.lastname || ''}`.trim()
      : profile?.tutor
        ? `${profile.tutor.firstname || ''} ${profile.tutor.lastname || ''}`.trim()
        : 'Parent';
  const overdueTranches = payments?.tranches.filter((t) => t.status === 'overdue') || [];
  const recentGrades = (grades || []).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour, ${displayName}`}
        description={
          selectedChild
            ? `${selectedChild.firstname} ${selectedChild.lastname}${selectedChild.current_classroom ? ` - ${selectedChild.current_classroom.name}` : ''}`
            : undefined
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/grades">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dernieres notes</p>
                <p className="text-2xl font-bold">
                  {gradesLoading ? '...' : recentGrades.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/payments">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <CreditCard className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde restant</p>
                <p className="text-2xl font-bold">
                  {paymentsLoading ? '...' : formatCurrency(payments?.totalRemaining || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/messaging">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/attendance">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Absences</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Grades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Dernieres notes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/grades" className="flex items-center gap-1 text-primary">
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : recentGrades.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Aucune note disponible
              </div>
            ) : (
              <div className="space-y-3">
                {recentGrades.map((note: any) => (
                  <div key={note.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {note.evaluation?.classroom_subject?.subject?.name || 'Matiere'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {note.evaluation?.name || 'Evaluation'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">
                        {note.is_absent ? 'ABS' : note.score}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{note.evaluation?.max_score || 20}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Paiements</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/payments" className="flex items-center gap-1 text-primary">
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : !payments ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Aucune information de paiement
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatCurrency(payments.totalFees)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Paye</span>
                  <span className="font-semibold text-success">{formatCurrency(payments.totalPaid)}</span>
                </div>
                {payments.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remise</span>
                    <span className="font-semibold">{formatCurrency(payments.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Reste a payer</span>
                  <span className="font-bold text-lg">{formatCurrency(payments.totalRemaining)}</span>
                </div>

                {overdueTranches.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">
                      {overdueTranches.length} tranche{overdueTranches.length > 1 ? 's' : ''} en retard
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
