import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { SchoolHeader } from '../shared/SchoolHeader';
import { SignatureBlock, FooterNote, PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { formatMoney, fmtDateTime } from '../shared/formatters';
import type { SchoolInfo, StudentRef, YearRef } from '../types';

export interface PaymentStatusData {
  school: SchoolInfo;
  year: YearRef;
  student: StudentRef;
  generatedAt: string;
  lines: Array<{ label: string; paid: number; remaining: number }>;
}

const ls = StyleSheet.create({
  studentInfo: {
    textAlign: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
    textAlign: 'center',
  },
  studentMeta: {
    fontSize: 8.5,
    color: BRAND.ink3,
    textAlign: 'center',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: BRAND.navy,
    minHeight: 22,
  },
  totalCell: {
    padding: 4,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    borderRightStyle: 'solid',
  },
});

export function PaymentStatusDocument({ data }: { data: PaymentStatusData }) {
  const { school, year, student, generatedAt, lines } = data;

  const totalPaid = lines.reduce((sum, l) => sum + l.paid, 0);
  const totalRemaining = lines.reduce((sum, l) => sum + l.remaining, 0);

  return (
    <Document title="Statut de paiement" author={school.name}>
      <Page size="A4" orientation="portrait" style={s.page}>
        <SchoolHeader
          school={school}
          year={year}
          title="Statut de paiement"
          rightBlock={
            <Text style={{ fontSize: 8, color: BRAND.ink3, marginTop: 4 }}>
              Édité le : {fmtDateTime(generatedAt)}
            </Text>
          }
        />

        {/* Student info */}
        <View style={ls.studentInfo}>
          <Text style={ls.studentName}>{student.fullName}</Text>
          {student.matricule && (
            <Text style={ls.studentMeta}>Matricule : {student.matricule}</Text>
          )}
          {student.classroomName && (
            <Text style={ls.studentMeta}>Classe : {student.classroomName}</Text>
          )}
          {student.studentTypeLabel && (
            <Text style={ls.studentMeta}>Type : {student.studentTypeLabel}</Text>
          )}
        </View>

        {/* Table */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tHead}>
            <Text style={[s.th, { flex: 3 }]}>Libellé</Text>
            <Text style={[s.th, { flex: 1.5, textAlign: 'right' }]}>Montant payé</Text>
            <Text style={[s.th, { flex: 1.5, textAlign: 'right', borderRightWidth: 0 }]}>Reste à payer</Text>
          </View>

          {/* Rows */}
          {lines.map((line, i) => (
            <View key={i} style={i === lines.length - 1 ? s.tRowLast : s.tRow}>
              <Text style={[s.td, { flex: 3 }]}>{line.label}</Text>
              <Text style={[s.tdRight, { flex: 1.5 }]}>{formatMoney(line.paid, school.currency)}</Text>
              <Text style={[s.tdRight, { flex: 1.5, borderRightWidth: 0, color: line.remaining > 0 ? BRAND.danger : BRAND.success }]}>
                {formatMoney(line.remaining, school.currency)}
              </Text>
            </View>
          ))}

          {/* Total row */}
          <View style={ls.totalRow}>
            <Text style={[ls.totalCell, { flex: 3 }]}>TOTAL</Text>
            <Text style={[ls.totalCell, { flex: 1.5, textAlign: 'right' }]}>{formatMoney(totalPaid, school.currency)}</Text>
            <Text style={[ls.totalCell, { flex: 1.5, textAlign: 'right', borderRightWidth: 0 }]}>{formatMoney(totalRemaining, school.currency)}</Text>
          </View>
        </View>

        <View style={s.spacer20} />
        <SignatureBlock label="Le/La caissier(e)" showBlank />
        <FooterNote>Gardez soigneusement ce reçu. Il est la preuve de votre règlement.</FooterNote>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default PaymentStatusDocument;
