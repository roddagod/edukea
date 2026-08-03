import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { SchoolHeader } from '../shared/SchoolHeader';
import { SignatureBlock, PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { fmtDate, fmtNumber } from '../shared/formatters';
import type { SchoolInfo, YearRef } from '../types';

export interface SchoolEnrollmentTotalsData {
  school: SchoolInfo;
  year: YearRef;
  generatedAt: string;
  levels: Array<{ level: string; total: number; boys: number; girls: number }>;
}

const ls = StyleSheet.create({
  cassierLabel: {
    fontSize: 8.5,
    marginBottom: 10,
  },
  effectifHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.ink,
    minHeight: 24,
  },
  effectifHeaderCell: {
    padding: 5,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#888888',
    borderRightStyle: 'solid',
  },
  effectifSubHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.lineSoft,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.ink,
    borderBottomStyle: 'solid',
    minHeight: 20,
  },
  effectifSubHeaderCell: {
    padding: 4,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: BRAND.ink,
    borderRightStyle: 'solid',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: BRAND.primary,
    minHeight: 22,
  },
  totalCell: {
    padding: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    borderRightStyle: 'solid',
  },
});

export function SchoolEnrollmentTotalsDocument({ data }: { data: SchoolEnrollmentTotalsData }) {
  const { school, year, generatedAt, levels } = data;

  const grandTotal = levels.reduce((sum, l) => sum + l.total, 0);
  const grandBoys = levels.reduce((sum, l) => sum + l.boys, 0);
  const grandGirls = levels.reduce((sum, l) => sum + l.girls, 0);

  return (
    <Document title="Effectif total" author={school.name}>
      <Page size="A4" orientation="landscape" style={s.pageLandscape}>
        <SchoolHeader
          school={school}
          year={year}
          title="ÉFFECTIF TOTAL"
          rightBlock={
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: BRAND.navy }}>
                ANNÉE SCOLAIRE : {year.name}
              </Text>
              <Text style={{ fontSize: 8, color: BRAND.ink3, marginTop: 2 }}>
                Du {fmtDate(generatedAt)}
              </Text>
            </View>
          }
        />

        <Text style={ls.cassierLabel}>LE CAISSIER :</Text>

        <View style={[s.table, { maxWidth: 500 }]}>
          {/* Group header */}
          <View style={ls.effectifHeader}>
            <Text style={[ls.effectifHeaderCell, { flex: 2 }]}>NIVEAUX</Text>
            <Text style={[ls.effectifHeaderCell, { flex: 3, borderRightWidth: 0 }]}>EFFECTIF</Text>
          </View>

          {/* Sub header */}
          <View style={ls.effectifSubHeader}>
            <Text style={[ls.effectifSubHeaderCell, { flex: 2 }]}>Niveau</Text>
            <Text style={[ls.effectifSubHeaderCell, { flex: 1 }]}>T</Text>
            <Text style={[ls.effectifSubHeaderCell, { flex: 1 }]}>G</Text>
            <Text style={[ls.effectifSubHeaderCell, { flex: 1, borderRightWidth: 0 }]}>F</Text>
          </View>

          {/* Data rows */}
          {levels.map((level, i) => (
            <View key={i} style={i === levels.length - 1 ? s.tRowLast : s.tRow}>
              <Text style={[s.td, { flex: 2 }]}>{level.level}</Text>
              <Text style={[s.tdRight, { flex: 1 }]}>{fmtNumber(level.total)}</Text>
              <Text style={[s.tdRight, { flex: 1 }]}>{fmtNumber(level.boys)}</Text>
              <Text style={[s.tdRight, { flex: 1, borderRightWidth: 0 }]}>{fmtNumber(level.girls)}</Text>
            </View>
          ))}

          {/* Grand total */}
          <View style={ls.totalRow}>
            <Text style={[ls.totalCell, { flex: 2, textAlign: 'left' }]}>TOTAL GÉNÉRAL</Text>
            <Text style={[ls.totalCell, { flex: 1 }]}>{fmtNumber(grandTotal)}</Text>
            <Text style={[ls.totalCell, { flex: 1 }]}>{fmtNumber(grandBoys)}</Text>
            <Text style={[ls.totalCell, { flex: 1, borderRightWidth: 0 }]}>{fmtNumber(grandGirls)}</Text>
          </View>
        </View>

        <View style={s.spacer20} />
        <SignatureBlock label="Le Directeur / La Directrice" showBlank />

        <PageFooter />
      </Page>
    </Document>
  );
}

export default SchoolEnrollmentTotalsDocument;
