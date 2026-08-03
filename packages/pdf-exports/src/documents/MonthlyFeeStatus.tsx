import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { SchoolHeader } from '../shared/SchoolHeader';
import { PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { formatMoney, fmtDate } from '../shared/formatters';
import type { SchoolInfo, YearRef } from '../types';

export interface MonthlyFeeStatusData {
  school: SchoolInfo;
  year: YearRef;
  classroomName: string;
  date: string;
  rows: Array<{
    matricule: string;
    fullName: string;
    studentType: string;
    classroom: string;
    installmentAmount: number;
    installmentPaid: number;
    remaining: number;
    dueDate: string;
  }>;
}

const ls = StyleSheet.create({
  dateTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: BRAND.navy,
    minHeight: 22,
  },
  totalCell: {
    padding: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    borderRightStyle: 'solid',
  },
});

export function MonthlyFeeStatusDocument({ data }: { data: MonthlyFeeStatusData }) {
  const { school, year, classroomName, date, rows } = data;

  const totalInstallment = rows.reduce((sum, r) => sum + r.installmentAmount, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.installmentPaid, 0);
  const totalRemaining = rows.reduce((sum, r) => sum + r.remaining, 0);

  return (
    <Document title={`État mensuel scolarité – ${classroomName}`} author={school.name}>
      <Page size="A4" orientation="landscape" style={s.pageLandscape}>
        <SchoolHeader
          school={school}
          year={year}
          title={`ÉTAT MENSUEL DE SCOLARITÉ : ${classroomName}`}
          rightBlock={
            <Text style={{ fontSize: 8, color: BRAND.ink3, marginTop: 4 }}>
              Total élèves : {rows.length}
            </Text>
          }
        />

        <Text style={ls.dateTitle}>Du {fmtDate(date)}</Text>

        <View style={s.table}>
          {/* Header */}
          <View style={s.tHead}>
            <Text style={[s.th, { width: 22 }]}>N°</Text>
            <Text style={[s.th, { width: 62 }]}>Matricule</Text>
            <Text style={[s.th, { flex: 2.5 }]}>Nom et Prénoms</Text>
            <Text style={[s.th, { flex: 1 }]}>Type</Text>
            <Text style={[s.th, { flex: 1 }]}>Classe</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: 'right' }]}>Mnt échéance</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: 'right' }]}>Mnt réglé</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: 'right' }]}>Reste à payer</Text>
            <Text style={[s.th, { flex: 1, borderRightWidth: 0 }]}>Date limite</Text>
          </View>

          {/* Rows */}
          {rows.map((row, i) => (
            <View key={i} style={i === rows.length - 1 ? s.tRowLast : s.tRow}>
              <Text style={[s.td, { width: 22 }]}>{i + 1}</Text>
              <Text style={[s.tdMono, { width: 62 }]}>{row.matricule}</Text>
              <Text style={[s.td, { flex: 2.5 }]}>{row.fullName}</Text>
              <Text style={[s.td, { flex: 1 }]}>{row.studentType}</Text>
              <Text style={[s.td, { flex: 1 }]}>{row.classroom}</Text>
              <Text style={[s.tdRight, { flex: 1.2 }]}>{formatMoney(row.installmentAmount, school.currency)}</Text>
              <Text style={[s.tdRight, { flex: 1.2 }]}>{formatMoney(row.installmentPaid, school.currency)}</Text>
              <Text style={[s.tdRight, { flex: 1.2, color: row.remaining > 0 ? BRAND.danger : BRAND.success }]}>
                {formatMoney(row.remaining, school.currency)}
              </Text>
              <Text style={[s.td, { flex: 1, borderRightWidth: 0 }]}>{fmtDate(row.dueDate)}</Text>
            </View>
          ))}

          {/* Total row */}
          <View style={ls.totalRow}>
            <Text style={[ls.totalCell, { width: 22 }]}> </Text>
            <Text style={[ls.totalCell, { width: 62 }]}> </Text>
            <Text style={[ls.totalCell, { flex: 2.5 }]}>TOTAL</Text>
            <Text style={[ls.totalCell, { flex: 1 }]}> </Text>
            <Text style={[ls.totalCell, { flex: 1 }]}> </Text>
            <Text style={[ls.totalCell, { flex: 1.2, textAlign: 'right' }]}>{formatMoney(totalInstallment, school.currency)}</Text>
            <Text style={[ls.totalCell, { flex: 1.2, textAlign: 'right' }]}>{formatMoney(totalPaid, school.currency)}</Text>
            <Text style={[ls.totalCell, { flex: 1.2, textAlign: 'right' }]}>{formatMoney(totalRemaining, school.currency)}</Text>
            <Text style={[ls.totalCell, { flex: 1, borderRightWidth: 0 }]}> </Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default MonthlyFeeStatusDocument;
