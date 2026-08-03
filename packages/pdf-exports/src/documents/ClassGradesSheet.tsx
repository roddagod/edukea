import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { fmtDate, fmtSex } from '../shared/formatters';
import type { SchoolInfo, StudentRef, YearRef, ClassroomRef } from '../types';

export interface ClassGradesSheetData {
  school: SchoolInfo;
  year: YearRef;
  classroom: ClassroomRef;
  students: Array<StudentRef & { matricule: string; fullName: string }>;
  stats: { males: number; females: number; repeatMales: number; repeatFemales: number };
}

// Number of empty note columns
const NOTE_COLS = 10;

const ls = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.primary,
    borderBottomStyle: 'solid',
  },
  schoolName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
  },
  headerRight: {
    textAlign: 'right',
  },
  headerRightTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
    textAlign: 'right',
  },
  statsBox: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderStyle: 'solid',
    padding: 6,
    backgroundColor: BRAND.lineSoft,
  },
  statsCol: {
    flex: 1,
  },
  statLine: {
    fontSize: 7.5,
    marginBottom: 2,
  },
  infoLine: {
    fontSize: 7.5,
    marginBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.line,
    borderBottomStyle: 'solid',
    paddingBottom: 2,
  },
  noteColHeader: {
    width: 26,
    padding: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    borderRightWidth: 0.5,
    borderRightColor: BRAND.ink,
    borderRightStyle: 'solid',
    textAlign: 'center',
  },
  noteColCell: {
    width: 26,
    padding: 3,
    fontSize: 7,
    borderRightWidth: 0.5,
    borderRightColor: BRAND.ink,
    borderRightStyle: 'solid',
  },
});

export function ClassGradesSheetDocument({ data }: { data: ClassGradesSheetData }) {
  const { school, year, classroom, students, stats } = data;
  const displayName = school.displayName ?? school.name;

  return (
    <Document title={`Liste de classe – ${classroom.name}`} author={school.name}>
      <Page size="A4" orientation="landscape" style={s.pageLandscape}>
        {/* Custom header */}
        <View style={ls.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={ls.schoolName}>{displayName}</Text>
            {school.address && <Text style={{ fontSize: 7.5, color: BRAND.ink3 }}>{school.address}</Text>}
            {school.phone && <Text style={{ fontSize: 7.5, color: BRAND.ink3 }}>Tél : {school.phone}</Text>}
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={s.titleBox}>
              <Text style={s.titleText}>LISTE DE CLASSE : {classroom.name}</Text>
            </View>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={ls.headerRightTitle}>{students.length} Élève(s)</Text>
            <Text style={{ fontSize: 8.5, textAlign: 'right' }}>Année scolaire {year.name}</Text>
          </View>
        </View>

        {/* Stats block */}
        <View style={ls.statsBox}>
          <View style={ls.statsCol}>
            <Text style={ls.statLine}>M: {stats.males}   R: 0   RM: {stats.repeatMales}   All: 0   AP: 0</Text>
            <Text style={ls.statLine}>F: {stats.females}   R: 0   RF: {stats.repeatFemales}   Eps: 0   Mus: 0</Text>
          </View>
          <View style={ls.statsCol}>
            <Text style={ls.infoLine}>PP: ............................................</Text>
            <Text style={ls.infoLine}>Educateur: ......................................</Text>
          </View>
          <View style={ls.statsCol}>
            <Text style={ls.infoLine}>Nom du prof : ..................................</Text>
            <Text style={ls.infoLine}>Discipline : ...................................</Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tHead}>
            <Text style={[s.th, { width: 20 }]}>N°</Text>
            <Text style={[s.th, { width: 56 }]}>Matricule</Text>
            <Text style={[s.th, { flex: 2 }]}>Nom & Prénoms</Text>
            <Text style={[s.th, { width: 18 }]}>S</Text>
            <Text style={[s.th, { width: 52 }]}>Née le</Text>
            <Text style={[s.th, { flex: 1 }]}>Lieu Nais.</Text>
            <Text style={[s.th, { width: 28 }]}>Cl.P</Text>
            <Text style={[s.th, { width: 28 }]}>LV2</Text>
            <Text style={[s.th, { width: 22 }]}>Red</Text>
            <Text style={[s.th, { width: 28 }]}>Nat</Text>
            <Text style={[s.th, { width: 28 }]}>AF</Text>
            {/* Empty note columns */}
            {Array.from({ length: NOTE_COLS }).map((_, i) => (
              <Text
                key={i}
                style={[ls.noteColHeader, i === NOTE_COLS - 1 ? { borderRightWidth: 0 } : {}]}
              >
                {' '}
              </Text>
            ))}
          </View>

          {/* Student rows */}
          {students.map((stu, i) => (
            <View key={i} style={i === students.length - 1 ? s.tRowLast : s.tRow}>
              <Text style={[s.td, { width: 20 }]}>{i + 1}</Text>
              <Text style={[s.tdMono, { width: 56 }]}>{stu.matricule}</Text>
              <Text style={[s.td, { flex: 2 }]}>{stu.fullName}</Text>
              <Text style={[s.td, { width: 18 }]}>{fmtSex(stu.sex)}</Text>
              <Text style={[s.td, { width: 52 }]}>{fmtDate(stu.birthDate)}</Text>
              <Text style={[s.td, { flex: 1 }]}>{stu.birthPlace ?? '—'}</Text>
              <Text style={[s.td, { width: 28 }]}>{stu.classroomName ?? '—'}</Text>
              <Text style={[s.td, { width: 28 }]}>{stu.lv2 ?? '—'}</Text>
              <Text style={[s.td, { width: 22 }]}>{stu.isRepeat ? 'Oui' : 'Non'}</Text>
              <Text style={[s.td, { width: 28 }]}>{stu.nationality ?? '—'}</Text>
              <Text style={[s.td, { width: 28 }]}>{stu.studentTypeLabel ?? '—'}</Text>
              {Array.from({ length: NOTE_COLS }).map((_, ni) => (
                <Text
                  key={ni}
                  style={[ls.noteColCell, ni === NOTE_COLS - 1 ? { borderRightWidth: 0 } : {}]}
                >
                  {' '}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default ClassGradesSheetDocument;
