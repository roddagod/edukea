import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { SchoolHeader } from '../shared/SchoolHeader';
import { PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { formatMoney, fmtDate } from '../shared/formatters';
import type { SchoolInfo, YearRef } from '../types';

export interface DailyCashRegisterData {
  school: SchoolInfo;
  year: YearRef;
  classroomName: string;
  date: string;
  rows: Array<{
    matricule: string;
    fullName: string;
    classroom: string;
    feeType: string;
    paymentMethod: string;
    amount: number;
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
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    borderRightStyle: 'solid',
  },
});

export function DailyCashRegisterDocument({ data }: { data: DailyCashRegisterData }) {
  const { school, year, classroomName, date, rows } = data;
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <Document title={`État journalier caisse – ${classroomName}`} author={school.name}>
      <Page size="A4" orientation="landscape" style={s.pageLandscape}>
        <SchoolHeader
          school={school}
          year={year}
          title={`ETAT JOURNALIER : ${classroomName}`}
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
            <Text style={[s.th, { width: 65 }]}>Matricule</Text>
            <Text style={[s.th, { flex: 2.5 }]}>Nom et Prénoms</Text>
            <Text style={[s.th, { flex: 1.2 }]}>Classe</Text>
            <Text style={[s.th, { flex: 1.5 }]}>Type règl.</Text>
            <Text style={[s.th, { flex: 1.2 }]}>Mode règl.</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: 'right', borderRightWidth: 0 }]}>Montant</Text>
          </View>

          {/* Rows */}
          {rows.map((row, i) => (
            <View key={i} style={i === rows.length - 1 ? s.tRowLast : s.tRow}>
              <Text style={[s.td, { width: 22 }]}>{i + 1}</Text>
              <Text style={[s.tdMono, { width: 65 }]}>{row.matricule}</Text>
              <Text style={[s.td, { flex: 2.5 }]}>{row.fullName}</Text>
              <Text style={[s.td, { flex: 1.2 }]}>{row.classroom}</Text>
              <Text style={[s.td, { flex: 1.5 }]}>{row.feeType}</Text>
              <Text style={[s.td, { flex: 1.2 }]}>{row.paymentMethod}</Text>
              <Text style={[s.tdRight, { flex: 1.2, borderRightWidth: 0 }]}>{formatMoney(row.amount, school.currency)}</Text>
            </View>
          ))}

          {/* Total */}
          <View style={ls.totalRow}>
            <Text style={[ls.totalCell, { width: 22 }]}> </Text>
            <Text style={[ls.totalCell, { width: 65 }]}> </Text>
            <Text style={[ls.totalCell, { flex: 2.5 }]}>Total du {fmtDate(date)}</Text>
            <Text style={[ls.totalCell, { flex: 1.2 }]}> </Text>
            <Text style={[ls.totalCell, { flex: 1.5 }]}> </Text>
            <Text style={[ls.totalCell, { flex: 1.2 }]}> </Text>
            <Text style={[ls.totalCell, { flex: 1.2, textAlign: 'right', borderRightWidth: 0 }]}>
              {formatMoney(totalAmount, school.currency)}
            </Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default DailyCashRegisterDocument;
