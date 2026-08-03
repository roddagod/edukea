import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { formatMoney, fmtDate } from '../shared/formatters';
import type { SchoolInfo, YearRef } from '../types';

export interface PaymentReminderData {
  school: SchoolInfo;
  year: YearRef;
  classroomName: string;
  cards: Array<{
    studentFullName: string;
    amountRequested: number;
    totalRemaining: number;
    dueDate: string;
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
    padding: 10,
    minHeight: 140,
  },
  cardSchoolName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
  },
  cardMeta: {
    fontSize: 7.5,
    color: BRAND.ink3,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: BRAND.primary,
    textTransform: 'uppercase',
    marginVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: BRAND.ink,
    borderTopStyle: 'solid',
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.ink,
    borderBottomStyle: 'solid',
    paddingVertical: 4,
  },
  cardBody: {
    fontSize: 8.5,
    lineHeight: 1.5,
    marginVertical: 4,
  },
  cardBodyBold: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.5,
  },
  cardWarning: {
    fontSize: 8,
    fontStyle: 'italic',
    color: BRAND.danger,
    marginTop: 4,
  },
  cardSignature: {
    marginTop: 8,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
});

function ReminderCard({
  school,
  year,
  classroomName,
  card,
}: {
  school: SchoolInfo;
  year: YearRef;
  classroomName: string;
  card: PaymentReminderData['cards'][number];
}) {
  const displayName = school.displayName ?? school.name;
  return (
    <View style={ls.card}>
      {/* School info */}
      <Text style={ls.cardSchoolName}>{displayName}</Text>
      {school.address && <Text style={ls.cardMeta}>{school.address}</Text>}
      {school.phone && <Text style={ls.cardMeta}>Tél : {school.phone}</Text>}
      <Text style={ls.cardMeta}>Année scolaire : {year.name}   |   Classe : {classroomName}</Text>

      {/* Title */}
      <Text style={ls.cardTitle}>Avis de reglement</Text>

      {/* Body */}
      <Text style={ls.cardBody}>
        {'Monsieur, Madame,\n'}
        <Text>
          {'Vous êtes prié(e) de bien vouloir vous acquitter d\'une tranche à\nhauteur de '}
        </Text>
        <Text style={ls.cardBodyBold}>{formatMoney(card.amountRequested, school.currency)}</Text>
        <Text>{', sur les '}</Text>
        <Text style={ls.cardBodyBold}>{formatMoney(card.totalRemaining, school.currency)}</Text>
        <Text>{' restants de votre enfant '}</Text>
        <Text style={ls.cardBodyBold}>{card.studentFullName}</Text>
        <Text>{', au plus tard le '}</Text>
        <Text style={ls.cardBodyBold}>{fmtDate(card.dueDate)}</Text>
        <Text>{', délai de rigueur.'}
        </Text>
      </Text>

      <Text style={ls.cardWarning}>
        Passée cette date, un contrôle se fera à l'entrée !
      </Text>

      <Text style={ls.cardBody}>Merci de votre compréhension.</Text>

      <Text style={ls.cardSignature}>La Direction</Text>
    </View>
  );
}

export function PaymentReminderDocument({ data }: { data: PaymentReminderData }) {
  const { school, year, classroomName, cards } = data;

  // Split into pages of 6 (2 cols x 3 rows)
  type Card = PaymentReminderData['cards'][number];
  const pages: Card[][] = [];
  for (let i = 0; i < cards.length; i += 6) {
    pages.push(cards.slice(i, i + 6));
  }

  return (
    <Document title={`Avis de règlement – ${classroomName}`} author={school.name}>
      {pages.map((pageCards: Card[], pi: number) => (
        <Page key={pi} size="A4" orientation="portrait" style={s.page}>
          <View style={ls.grid}>
            {pageCards.map((card: Card, ci: number) => (
              <ReminderCard
                key={ci}
                school={school}
                year={year}
                classroomName={classroomName}
                card={card}
              />
            ))}
          </View>
          <PageFooter />
        </Page>
      ))}
    </Document>
  );
}

export default PaymentReminderDocument;
