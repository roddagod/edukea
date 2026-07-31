import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Currency } from '@edukea/shared';

export interface PaymentReceiptData {
  receiptNumber: string;
  paymentDate: string;
  school: {
    name: string;
    displayName?: string | null;
    logoUrl?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    accentColor?: string | null;
    directorSignatureUrl?: string | null;
  };
  student: {
    matricule: string | null;
    fullName: string;
    classroomName: string;
    schoolYearName: string;
  };
  payment: {
    totalAmount: number;
    source: 'cash' | 'bank_transfer' | 'internal';
    memo?: string | null;
    occurredAt: string;
  };
  allocations: Array<{
    installmentLabel: string | null;
    amount: number;
  }>;
}

const NUM = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

function fmtMoney(amount: number, currency: Currency): string {
  return `${NUM.format(amount)} ${currency}`;
}

const SOURCE_LABEL: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement bancaire',
  internal: 'Interne',
};

function makeStyles(accent: string) {
  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#0f172a',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
      borderBottom: 2,
      borderBottomColor: accent,
      borderBottomStyle: 'solid',
      paddingBottom: 12,
    },
    schoolBlock: {
      flex: 1,
    },
    schoolName: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: accent,
    },
    schoolMeta: {
      fontSize: 9,
      color: '#64748b',
      marginTop: 2,
    },
    logo: {
      width: 60,
      height: 60,
    },
    receiptTitle: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    receiptNumber: {
      fontSize: 10,
      textAlign: 'center',
      color: '#64748b',
      marginBottom: 16,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
    },
    label: {
      color: '#64748b',
    },
    value: {
      fontFamily: 'Helvetica-Bold',
    },
    total: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      marginTop: 8,
      borderTop: 1,
      borderTopColor: '#cbd5e1',
      borderTopStyle: 'solid',
      borderBottom: 2,
      borderBottomColor: '#cbd5e1',
      borderBottomStyle: 'solid',
    },
    totalLabel: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
    },
    totalValue: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: accent,
    },
    allocationTable: {
      marginTop: 8,
    },
    allocationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      borderBottom: 0.5,
      borderBottomColor: '#e2e8f0',
      borderBottomStyle: 'solid',
    },
    allocationAmount: {
      fontFamily: 'Helvetica-Bold',
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    signatureBlock: {
      alignItems: 'center',
    },
    signatureLine: {
      fontSize: 9,
      color: '#64748b',
      textAlign: 'center',
      marginTop: 4,
      borderTop: 1,
      borderTopColor: '#94a3b8',
      borderTopStyle: 'solid',
      paddingTop: 4,
      width: 140,
    },
    signatureImage: {
      width: 80,
      height: 40,
    },
    smallText: {
      fontSize: 8,
      color: '#94a3b8',
      textAlign: 'center',
    },
  });
}

export function PaymentReceiptDocument({ data, currency }: { data: PaymentReceiptData; currency: Currency }) {
  const accent = data.school.accentColor || '#E97423';
  const styles = makeStyles(accent);

  return (
    <Document title={`Recu ${data.receiptNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header : école (gauche) + logo (droite) */}
        <View style={styles.header}>
          <View style={styles.schoolBlock}>
            <Text style={styles.schoolName}>{data.school.displayName || data.school.name}</Text>
            {data.school.address && (
              <Text style={styles.schoolMeta}>{data.school.address}</Text>
            )}
            {(data.school.phone || data.school.email) && (
              <Text style={styles.schoolMeta}>
                {[data.school.phone, data.school.email].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
          {data.school.logoUrl && (
            <Image src={data.school.logoUrl} style={styles.logo} />
          )}
        </View>

        <Text style={styles.receiptTitle}>RECU DE PAIEMENT</Text>
        <Text style={styles.receiptNumber}>N° {data.receiptNumber}</Text>

        {/* Section élève */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ELEVE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom complet</Text>
            <Text style={styles.value}>{data.student.fullName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Matricule</Text>
            <Text style={styles.value}>{data.student.matricule || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Classe</Text>
            <Text style={styles.value}>{data.student.classroomName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Année scolaire</Text>
            <Text style={styles.value}>{data.student.schoolYearName}</Text>
          </View>
        </View>

        {/* Section paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAIEMENT</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{DATE.format(new Date(data.payment.occurredAt))}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mode</Text>
            <Text style={styles.value}>{SOURCE_LABEL[data.payment.source] || data.payment.source}</Text>
          </View>
          {data.payment.memo && (
            <View style={styles.row}>
              <Text style={styles.label}>Mémo</Text>
              <Text style={styles.value}>{data.payment.memo}</Text>
            </View>
          )}
          <View style={styles.total}>
            <Text style={styles.totalLabel}>MONTANT RECU</Text>
            <Text style={styles.totalValue}>{fmtMoney(data.payment.totalAmount, currency)}</Text>
          </View>
        </View>

        {/* Ventilation */}
        {data.allocations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VENTILATION</Text>
            <View style={styles.allocationTable}>
              {data.allocations.map((a, i) => (
                <View key={i} style={styles.allocationRow}>
                  <Text>{a.installmentLabel || 'Avance / trop-percu'}</Text>
                  <Text style={styles.allocationAmount}>{fmtMoney(a.amount, currency)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer : signature + info édition */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.smallText}>Document généré par Edukea</Text>
            <Text style={styles.smallText}>{DATE.format(new Date())}</Text>
          </View>
          <View style={styles.signatureBlock}>
            {data.school.directorSignatureUrl && (
              <Image src={data.school.directorSignatureUrl} style={styles.signatureImage} />
            )}
            <Text style={styles.signatureLine}>Signature du Directeur</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}