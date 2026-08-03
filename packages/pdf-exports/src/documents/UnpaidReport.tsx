import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { SchoolHeader } from '../shared/SchoolHeader';
import { PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { formatMoney, fmtDate } from '../shared/formatters';
import type { SchoolInfo, YearRef } from '../types';

export interface UnpaidReportData {
  school: SchoolInfo;
  year: YearRef;
  classroomName: string;
  date: string;
  rows: Array<{
    matricule: string;
    fullName: string;
    classroom: string;
    inscription: number;
    annexFees: number;
    tuition: number;
    discount: number;
    remaining: number;
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

export function UnpaidReportDocument({ data }: { data: UnpaidReportData }) {
  const { school, year, classroomName, date, rows } = data;

  const totals = rows.reduce(
    (acc, r) => ({
      inscription: acc.inscription + r.inscription,
      annexFees: acc.annexFees + r.annexFees,
      tuition: acc.tuition + r.tuition,
      discount: acc.discount + r.discount,
      remaining: acc.remaining + r.remaining,
    }),
    { inscription: 0, annexFees: 0, tuition: 0, discount: 0, remaining: 0 }
  );

  return (
    <Document title={`Contrôle des impayés – ${classroomName}`} author={school.name}>
      <Page size="A4" orientation="landscape" style={s.pageLandscape}>
        <SchoolHeader
          school={school}
          year={year}
          title={`CONTROLLE DES IMPAYÉ : ${classroomName}`}
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
            <Text style={[s.th, { flex: 1 }]}>Classe</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: 'right' }]}>Inscription</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: 'right' }]}>Frais annexe</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: 'right' }]}>Scolarité</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: 'right' }]}>Remise</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: 'right', borderRightWidth: 0 }]}>Reste</Text>
          </View>

          {/* Rows */}
          {rows.map((row, i) => (
            <View key={i} style={i === rows.length - 1 ? s.tRowLast : s.tRow}>
              <Text style={[s.td, { width: 22 }]}>{i + 1}</Text>
              <Text style={[s.tdMono, { width: 62 }]}>{row.matricule}</Text>
              <Text style={[s.td, { flex: 2.5 }]}>{row.fullName}</Text>
              <Text style={[s.td, { flex: 1 }]}>{row.classroom}</Text>
              <Text style={[s.tdRight, { flex: 1.2 }]}>{formatMoney(row.inscription, school.currency)}</Text>
              <Text style={[s.tdRight, { flex: 1.2 }]}>{formatMoney(row.annexFees, school.currency)}</Text>
              <Text style={[s.tdRight, { flex: 1.2 }]}>{formatMoney(row.tuition, school.currency)}</Text>
              <Text style={[s.tdRight, { flex: 1.2 }]}>{formatMoney(row.discount, school.currency)}</Text>
              <Text style={[s.tdRight, { flex: 1.2, borderRightWidth: 0, color: row.remaining > 0 ? BRAND.danger : BRAND.success }]}>
                {formatMoney(row.remaining, school.currency)}
              </Text>
            </View>
          ))}

          {/* Total row */}
          <View style={ls.totalRow}>
            <Text style={[ls.totalCell, { width: 22 }]}> </Text>
            <Text style={[ls.totalCell, { width: 62 }]}> </Text>
            <Text style={[ls.totalCell, { flex: 2.5 }]}>TOTAL</Text>
            <Text style={[ls.totalCell, { flex: 1 }]}> </Text>
            <Text style={[ls.totalCell, { flex: 1.2, textAlign: 'right' }]}>{formatMoney(totals.inscription, school.currency)}</Text>
            <Text style={[ls.totalCell, { flex: 1.2, textAlign: 'right' }]}>{formatMoney(totals.annexFees, school.currency)}</Text>
            <Text style={[ls.totalCell, { flex: 1.2, textAlign: 'right' }]}>{formatMoney(totals.tuition, school.currency)}</Text>
            <Text style={[ls.totalCell, { flex: 1.2, textAlign: 'right' }]}>{formatMoney(totals.discount, school.currency)}</Text>
            <Text style={[ls.totalCell, { flex: 1.2, textAlign: 'right', borderRightWidth: 0 }]}>{formatMoney(totals.remaining, school.currency)}</Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default UnpaidReportDocument;
