import { Document, Page, View, Text } from '@react-pdf/renderer';
import { SchoolHeader } from '../shared/SchoolHeader';
import { PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { fmtDate, fmtSex } from '../shared/formatters';
import type { SchoolInfo, StudentRef, YearRef } from '../types';

export interface StateAffectedListData {
  school: SchoolInfo;
  year: YearRef;
  classroomName: string;
  students: Array<StudentRef & { matricule: string; fullName: string }>;
}

export function StateAffectedListDocument({ data }: { data: StateAffectedListData }) {
  const { school, year, classroomName, students } = data;

  return (
    <Document title={`Affectés de l'État – ${classroomName}`} author={school.name}>
      <Page size="A4" orientation="landscape" style={s.pageLandscape}>
        <SchoolHeader
          school={school}
          year={year}
          title={`AFFECTEES DE L'ETAT : ${classroomName}`}
          rightBlock={
            <Text style={{ fontSize: 8, color: BRAND.ink3, marginTop: 4 }}>
              Total élèves : {students.length}
            </Text>
          }
        />

        <View style={s.table}>
          {/* Header */}
          <View style={s.tHead}>
            <Text style={[s.th, { width: 22 }]}>N°</Text>
            <Text style={[s.th, { width: 62 }]}>Matricule</Text>
            <Text style={[s.th, { flex: 2.5 }]}>Nom et Prénoms</Text>
            <Text style={[s.th, { width: 22 }]}>Sexe</Text>
            <Text style={[s.th, { width: 58 }]}>Né(s) le</Text>
            <Text style={[s.th, { flex: 1 }]}>Nat.</Text>
            <Text style={[s.th, { flex: 1.3 }]}>Lieu Nais.</Text>
            <Text style={[s.th, { flex: 1 }]}>Matière sec.</Text>
            <Text style={[s.th, { width: 36 }]}>LV2</Text>
            <Text style={[s.th, { width: 64, borderRightWidth: 0 }]}>Date d'inscription</Text>
          </View>

          {/* Rows */}
          {students.map((stu, i) => (
            <View key={i} style={i === students.length - 1 ? s.tRowLast : s.tRow}>
              <Text style={[s.td, { width: 22 }]}>{i + 1}</Text>
              <Text style={[s.tdMono, { width: 62 }]}>{stu.matricule}</Text>
              <Text style={[s.td, { flex: 2.5 }]}>{stu.fullName}</Text>
              <Text style={[s.td, { width: 22 }]}>{fmtSex(stu.sex)}</Text>
              <Text style={[s.td, { width: 58 }]}>{fmtDate(stu.birthDate)}</Text>
              <Text style={[s.td, { flex: 1 }]}>{stu.nationality ?? '—'}</Text>
              <Text style={[s.td, { flex: 1.3 }]}>{stu.birthPlace ?? '—'}</Text>
              <Text style={[s.td, { flex: 1 }]}>{stu.secondarySubject ?? '—'}</Text>
              <Text style={[s.td, { width: 36 }]}>{stu.lv2 ?? '—'}</Text>
              <Text style={[s.td, { width: 64, borderRightWidth: 0 }]}>{fmtDate(stu.enrollmentDate)}</Text>
            </View>
          ))}
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default StateAffectedListDocument;
