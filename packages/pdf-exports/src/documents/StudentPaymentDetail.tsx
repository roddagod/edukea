import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { SchoolHeader } from '../shared/SchoolHeader';
import { PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { formatMoney, fmtDate, fmtDateTime } from '../shared/formatters';
import type { SchoolInfo, StudentRef, YearRef, FeeLineDetail } from '../types';

export interface StudentPaymentDetailData {
  school: SchoolInfo;
  year: YearRef;
  student: StudentRef;
  classroomName: string;
  generatedAt: string;
  feeLines: FeeLineDetail[];
  reduction?: number;
}

const ls = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  studentTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
  },
  metaRight: {
    fontSize: 8.5,
    color: BRAND.ink3,
    textAlign: 'right',
  },
  feeSectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: BRAND.lineSoft,
    padding: 5,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: BRAND.ink,
    borderStyle: 'solid',
    borderBottomWidth: 0,
  },
  miniHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.lineSoft,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.ink,
    borderBottomStyle: 'solid',
  },
  noPayment: {
    fontSize: 8,
    color: BRAND.ink3,
    fontStyle: 'italic',
    padding: 5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BRAND.ink,
    borderStyle: 'solid',
  },
  remaining: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.danger,
    padding: 4,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BRAND.ink,
    borderStyle: 'solid',
    textAlign: 'right',
    marginBottom: 8,
  },
  reductionBox: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.success,
    borderWidth: 1,
    borderColor: BRAND.success,
    borderStyle: 'solid',
    padding: 6,
  },
});

export function StudentPaymentDetailDocument({ data }: { data: StudentPaymentDetailData }) {
  const { school, year, student, classroomName, generatedAt, feeLines, reduction } = data;

  return (
    <Document title={`Versements – ${student.fullName}`} author={school.name}>
      <Page size="A4" orientation="portrait" style={s.page}>
        <SchoolHeader school={school} year={year} />

        {/* Page title + meta */}
        <View style={ls.metaRow}>
          <View>
            <Text style={ls.studentTitle}>Versement de l'élève {student.fullName}</Text>
            {student.matricule && (
              <Text style={{ fontSize: 8.5, color: BRAND.ink3, marginTop: 2 }}>Matricule : {student.matricule}</Text>
            )}
          </View>
          <View>
            <Text style={ls.metaRight}>Année : {year.name}</Text>
            <Text style={ls.metaRight}>Classe : {classroomName}</Text>
            <Text style={ls.metaRight}>Édité le : {fmtDateTime(generatedAt)}</Text>
          </View>
        </View>

        {/* Fee lines */}
        {feeLines.map((fee, fi) => (
          <View key={fi} style={{ marginBottom: 4 }}>
            {/* Section title: label + totalDue */}
            <Text style={ls.feeSectionTitle}>
              - {fee.label}   {formatMoney(fee.totalDue, school.currency)}
            </Text>

            {fee.payments && fee.payments.length > 0 ? (
              <View>
                <View style={[s.table, { borderTopWidth: 0 }]}>
                  <View style={ls.miniHeader}>
                    <Text style={[s.th, { flex: 1.5, textAlign: 'right' }]}>Montant versé</Text>
                    <Text style={[s.th, { flex: 1.5 }]}>Date</Text>
                    <Text style={[s.th, { flex: 1.5, borderRightWidth: 0 }]}>Mode</Text>
                  </View>
                  {fee.payments.map((p, pi) => (
                    <View key={pi} style={pi === (fee.payments?.length ?? 0) - 1 ? s.tRowLast : s.tRow}>
                      <Text style={[s.tdRight, { flex: 1.5 }]}>{formatMoney(p.amount, school.currency)}</Text>
                      <Text style={[s.td, { flex: 1.5 }]}>{fmtDate(p.date)}</Text>
                      <Text style={[s.td, { flex: 1.5, borderRightWidth: 0 }]}>{p.method}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={ls.noPayment}>Aucun versement</Text>
            )}

            <Text style={ls.remaining}>
              Reste à payer : {formatMoney(fee.remaining, school.currency)}
            </Text>
          </View>
        ))}

        {/* Reduction note */}
        {reduction != null && reduction > 0 && (
          <Text style={ls.reductionBox}>
            Cet élève bénéficie d'une réduction : {formatMoney(reduction, school.currency)}
          </Text>
        )}

        <PageFooter />
      </Page>
    </Document>
  );
}

export default StudentPaymentDetailDocument;
