import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { SchoolHeader } from '../shared/SchoolHeader';
import { PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import type { SchoolInfo, YearRef } from '../types';

export interface ParentContactListData {
  school: SchoolInfo;
  year: YearRef;
  classroomName: string;
  rows: Array<{
    matricule: string;
    fullName: string;
    sex: string;
    classroom: string;
    father?: { name?: string; phone?: string };
    mother?: { name?: string; phone?: string };
    guardian?: { name?: string; phone?: string };
  }>;
}

const ls = StyleSheet.create({
  groupHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.navy,
    minHeight: 18,
  },
  groupHeaderCell: {
    padding: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#FFFFFF',
    borderRightStyle: 'solid',
  },
});

export function ParentContactListDocument({ data }: { data: ParentContactListData }) {
  const { school, year, classroomName, rows } = data;

  return (
    <Document title={`Liste parents d'élèves – ${classroomName}`} author={school.name}>
      <Page size="A4" orientation="landscape" style={s.pageLandscape}>
        <SchoolHeader
          school={school}
          year={year}
          title={`LISTE DES PARENT D'ÉLEVES : ${classroomName}`}
          rightBlock={
            <Text style={{ fontSize: 8, color: BRAND.ink3, marginTop: 4 }}>
              Total élèves : {rows.length}
            </Text>
          }
        />

        <View style={s.table}>
          {/* Group header row */}
          <View style={ls.groupHeader}>
            {/* Seq */}
            <Text style={[ls.groupHeaderCell, { width: 22 }]}> </Text>
            {/* Élève group */}
            <Text style={[ls.groupHeaderCell, { flex: 2.2, borderRightWidth: 1 }]}>Élève</Text>
            {/* Père group */}
            <Text style={[ls.groupHeaderCell, { flex: 1.8, borderRightWidth: 1 }]}>Père</Text>
            {/* Mère group */}
            <Text style={[ls.groupHeaderCell, { flex: 1.8, borderRightWidth: 1 }]}>Mère</Text>
            {/* Tuteur group */}
            <Text style={[ls.groupHeaderCell, { flex: 1.8, borderRightWidth: 0 }]}>Tuteur</Text>
          </View>

          {/* Sub-header row */}
          <View style={s.tHead}>
            <Text style={[s.th, { width: 22 }]}>N°</Text>
            {/* Élève sub-cols */}
            <Text style={[s.th, { width: 58 }]}>Matricule</Text>
            <Text style={[s.th, { flex: 1.8 }]}>Nom et Prénoms</Text>
            <Text style={[s.th, { width: 22 }]}>Sexe</Text>
            <Text style={[s.th, { width: 44 }]}>Classe</Text>
            {/* Père sub-cols */}
            <Text style={[s.th, { flex: 1.3 }]}>Nom et Prénoms</Text>
            <Text style={[s.th, { width: 68 }]}>Tél</Text>
            {/* Mère sub-cols */}
            <Text style={[s.th, { flex: 1.3 }]}>Nom et Prénoms</Text>
            <Text style={[s.th, { width: 68 }]}>Tél</Text>
            {/* Tuteur sub-cols */}
            <Text style={[s.th, { flex: 1.3 }]}>Nom et Prénoms</Text>
            <Text style={[s.th, { width: 68, borderRightWidth: 0 }]}>Tél</Text>
          </View>

          {/* Rows */}
          {rows.map((row, i) => (
            <View key={i} style={i === rows.length - 1 ? s.tRowLast : s.tRow}>
              <Text style={[s.td, { width: 22 }]}>{i + 1}</Text>
              <Text style={[s.tdMono, { width: 58 }]}>{row.matricule}</Text>
              <Text style={[s.td, { flex: 1.8 }]}>{row.fullName}</Text>
              <Text style={[s.td, { width: 22 }]}>{row.sex}</Text>
              <Text style={[s.td, { width: 44 }]}>{row.classroom}</Text>
              <Text style={[s.td, { flex: 1.3 }]}>{row.father?.name ?? '—'}</Text>
              <Text style={[s.td, { width: 68 }]}>{row.father?.phone ?? '—'}</Text>
              <Text style={[s.td, { flex: 1.3 }]}>{row.mother?.name ?? '—'}</Text>
              <Text style={[s.td, { width: 68 }]}>{row.mother?.phone ?? '—'}</Text>
              <Text style={[s.td, { flex: 1.3 }]}>{row.guardian?.name ?? '—'}</Text>
              <Text style={[s.td, { width: 68, borderRightWidth: 0 }]}>{row.guardian?.phone ?? '—'}</Text>
            </View>
          ))}
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default ParentContactListDocument;
