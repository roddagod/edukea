import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { fmtDate } from '../shared/formatters';
import type { SchoolInfo, YearRef } from '../types';

export interface ClassEntryTicketData {
  school: SchoolInfo;
  year: YearRef;
  cards: Array<{
    matricule: string;
    lastName: string;
    firstName: string;
    birthDate: string;
    enrollmentDate?: string;
    classroomName: string;
  }>;
}

const ls = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '48%',
    borderWidth: 1,
    borderColor: BRAND.ink,
    borderStyle: 'solid',
    padding: 8,
    minHeight: 120,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.ink,
    borderBottomStyle: 'solid',
  },
  cardSchoolName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
    flex: 1,
  },
  cardYear: {
    fontSize: 7.5,
    color: BRAND.ink3,
    textAlign: 'right',
  },
  cardTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: BRAND.navy,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.line,
    borderBottomStyle: 'solid',
    paddingBottom: 2,
  },
  fieldLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.ink2,
    width: 80,
  },
  fieldValue: {
    fontSize: 7.5,
    flex: 1,
  },
  cardFooter: {
    marginTop: 6,
    fontSize: 7,
    color: BRAND.ink3,
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: BRAND.line,
    borderTopStyle: 'solid',
    paddingTop: 4,
  },
  authLine: {
    marginTop: 4,
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'center',
    color: BRAND.ink,
  },
});

function EntryCard({
  school,
  year,
  card,
}: {
  school: SchoolInfo;
  year: YearRef;
  card: ClassEntryTicketData['cards'][number];
}) {
  const displayName = school.displayName ?? school.name;

  return (
    <View style={ls.card}>
      {/* Card header */}
      <View style={ls.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 }}>
          {school.logoUrl ? (
            <Image src={school.logoUrl} style={{ width: 24, height: 24, objectFit: 'contain' }} />
          ) : (
            <View style={{ width: 24, height: 24, borderWidth: 0.5, borderColor: BRAND.line, borderStyle: 'solid' }} />
          )}
          <Text style={ls.cardSchoolName}>{displayName}</Text>
        </View>
        <Text style={ls.cardYear}>Année {year.name}</Text>
      </View>

      {/* Title */}
      <Text style={ls.cardTitle}>Billet d'entrée en classe</Text>

      {/* Fields */}
      {card.enrollmentDate && (
        <View style={ls.fieldRow}>
          <Text style={ls.fieldLabel}>Date d'inscription :</Text>
          <Text style={ls.fieldValue}>{fmtDate(card.enrollmentDate)}</Text>
        </View>
      )}
      <View style={ls.fieldRow}>
        <Text style={ls.fieldLabel}>Matricule :</Text>
        <Text style={ls.fieldValue}>{card.matricule}</Text>
      </View>
      <View style={ls.fieldRow}>
        <Text style={ls.fieldLabel}>Nom :</Text>
        <Text style={ls.fieldValue}>{card.lastName}</Text>
      </View>
      <View style={ls.fieldRow}>
        <Text style={ls.fieldLabel}>Prénom :</Text>
        <Text style={ls.fieldValue}>{card.firstName}</Text>
      </View>
      <View style={ls.fieldRow}>
        <Text style={ls.fieldLabel}>Date de naissance :</Text>
        <Text style={ls.fieldValue}>{fmtDate(card.birthDate)}</Text>
      </View>

      {/* Autorisation */}
      <Text style={ls.authLine}>Est autorisé(e) à entrer en {card.classroomName}</Text>

      {/* Footer */}
      <Text style={ls.cardFooter}>
        {displayName} — Fait le ...../....../..... — Directeur des Etudes
      </Text>
    </View>
  );
}

export function ClassEntryTicketDocument({ data }: { data: ClassEntryTicketData }) {
  const { school, year, cards } = data;

  // 8 cards per page (2 cols x 4 rows)
  type Card = ClassEntryTicketData['cards'][number];
  const pages: Card[][] = [];
  for (let i = 0; i < cards.length; i += 8) {
    pages.push(cards.slice(i, i + 8));
  }

  return (
    <Document title="Billets d'entrée en classe" author={school.name}>
      {pages.map((pageCards: Card[], pi: number) => (
        <Page key={pi} size="A4" orientation="portrait" style={s.page}>
          <View style={ls.grid}>
            {pageCards.map((card: Card, ci: number) => (
              <EntryCard key={ci} school={school} year={year} card={card} />
            ))}
          </View>
          <PageFooter />
        </Page>
      ))}
    </Document>
  );
}

export default ClassEntryTicketDocument;
