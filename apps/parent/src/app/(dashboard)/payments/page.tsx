'use client';

import { CreditCard, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { LoadingPage } from '@/components/layout/loading-state';
import { useSelectedChild } from '@/components/layout/child-selector';
import { usePayments, formatCurrency, formatShortDate } from '@edukea/shared';

const statusConfig = {
  paid: { label: 'Solde', variant: 'success' as const, icon: CheckCircle2, color: 'text-success' },
  overdue: { label: 'En retard', variant: 'destructive' as const, icon: AlertCircle, color: 'text-destructive' },
  upcoming: { label: 'Bientot du', variant: 'warning' as const, icon: Clock, color: 'text-warning' },
  pending: { label: 'A venir', variant: 'secondary' as const, icon: Clock, color: 'text-muted-foreground' },
};

export default function PaymentsPage() {
  const { selectedChild, isLoading: childLoading } = useSelectedChild();
  const { data: payments, isLoading } = usePayments(selectedChild?.id);

  if (childLoading || isLoading) return <LoadingPage />;

  if (!payments) {
    return (
      <div className="space-y-6">
        <PageHeader title="Paiements" />
        <EmptyState
          icon={CreditCard}
          title="Aucune information de paiement"
          description="Les informations de paiement ne sont pas encore disponibles."
        />
      </div>
    );
  }

  const paidPercent = payments.totalFees > 0
    ? Math.round((payments.totalPaid / (payments.totalFees - payments.discount)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paiements"
        description={selectedChild ? `${selectedChild.firstname} ${selectedChild.lastname}` : undefined}
      />

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Frais totaux</p>
              <p className="text-2xl font-bold">{formatCurrency(payments.totalFees)}</p>
              {payments.discount > 0 && (
                <p className="text-xs text-muted-foreground">Remise : {formatCurrency(payments.discount)}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total paye</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(payments.totalPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reste a payer</p>
              <p className="text-2xl font-bold">{formatCurrency(payments.totalRemaining)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{paidPercent}%</span>
            </div>
            <Progress value={paidPercent} indicatorClassName={paidPercent >= 100 ? 'bg-success' : ''} />
          </div>
        </CardContent>
      </Card>

      {/* Tranches */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Echeancier</h2>
        <div className="space-y-3">
          {payments.tranches.map((tranche) => {
            const config = statusConfig[tranche.status];
            const StatusIcon = config.icon;
            const tranchePercent = tranche.amount > 0
              ? Math.round((tranche.amountPaid / tranche.amount) * 100)
              : 0;

            return (
              <Card key={tranche.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${config.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{tranche.name || 'Tranche'}</p>
                        <p className="text-sm text-muted-foreground">
                          Echeance : {tranche.due_date ? formatShortDate(tranche.due_date) : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={config.variant}>{config.label}</Badge>
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">{formatCurrency(tranche.amountPaid)}</span>
                        <span className="text-muted-foreground"> / {formatCurrency(tranche.amount)}</span>
                      </p>
                    </div>
                  </div>
                  {tranche.status !== 'paid' && tranche.amountPaid > 0 && (
                    <div className="mt-3">
                      <Progress value={tranchePercent} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
