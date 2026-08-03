import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { InstitutionalBlock } from '../shared/SchoolHeader';
import { SignatureBlock, PageFooter } from '../shared/DocumentFooter';
import { commonStyles as s, BRAND } from '../shared/styles';
import { formatMoney, fmtDate, fmtDateTime } from '../shared/formatters';
import type { SchoolInfo, StudentRef, YearRef } from '../types';

export interface PaymentReceiptData {
  school: SchoolInfo;
  year: YearRef;
  student: StudentRef;
  classroomName: string;
  totalDue: number;
  cumulativePaid: number;
  currentPayment: { amount: number; date: string };
  remaining: number;
  issuedAt: string;
}

const ls = StyleSheet.create({
  outerBox: {
    borderWidth: 1,
    borderColor: BRAND.ink,
    borderStyle: 'solid',
    padding: 16,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  schoolName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
    marginBottom: 2,
  },
  subText: {
    fontSize: 8,
    color: BRAND.ink3,
  },
  titleRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: BRAND.primary,
    borderBottomStyle: 'solid',
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.ink,
    borderBottomStyle: 'solid',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  infoLabel: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.ink2,
  },
  infoValue: {
    flex: 2,
    fontSize: 8.5,
  },
  separator: {
    borderTopWidth: 1.5,
    borderTopColor: BRAND.primary,
    borderTopStyle: 'dashed',
    marginVertical: 16,
  },
  copyLabel: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 7,
    color: BRAND.ink3,
    fontStyle: 'italic',
  },
});

function ReceiptBlock({ data, copyLabel }: { data: PaymentReceiptData; copyLabel: string }) {
  const { school, year, student, classroomName, totalDue, cumulativePaid, currentPayment, remaining, issuedAt } = data;
  const displayName = school.displayName ?? school.name;

  const rows = [
    { label: 'Matricule', value: student.matricule ?? '—' },
    { label: 'Nom et Prénoms', value: student.fullName },
    { label: 'Type', value: student.studentTypeLabel ?? '—' },
    { label: 'Total à payer', value: formatMoney(totalDue, school.currency) },
    { label: 'Cumul Règlement', value: formatMoney(cumulativePaid, school.currency) },
    { label: 'Règlement', value: `${formatMoney(currentPayment.amount, school.currency)} — ${fmtDate(currentPayment.date)}` },
    { label: 'Reste à payer', value: formatMoney(remaining, school.currency) },
    { label: 'Date (émission)', value: fmtDateTime(issuedAt) },
  ];

  return (
    <View style={ls.outerBox}>
      <Text style={ls.copyLabel}>{copyLabel}</Text>

      {/* Header */}
      <View style={ls.topRow}>
        <View style={{ flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
          {school.logoUrl ? (
            <Image src={school.logoUrl} style={{ width: 48, height: 48, objectFit: 'contain' }} />
          ) : (
            <View style={{ width: 48, height: 48, borderWidth: 1, borderColor: BRAND.line, borderStyle: 'solid' }} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ls.schoolName}>{displayName}</Text>
          {school.address && <Text style={ls.subText}>{school.address}</Text>}
          {school.phone && <Text style={ls.subText}>Tél : {school.phone}</Text>}
        </View>
        <InstitutionalBlock school={school} year={year} />
      </View>

      {/* Title */}
      <View style={ls.titleRow}>
        <Text style={ls.receiptTitle}>Reçu de paiement : {classroomName}</Text>
      </View>

      {/* Table rows */}
      <View style={{ borderWidth: 1, borderColor: BRAND.ink, borderStyle: 'solid' }}>
        {rows.map((r, i) => (
          <View key={i} style={[ls.infoRow, i === rows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
            <Text style={ls.infoLabel}>{r.label}</Text>
            <Text style={ls.infoValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <SignatureBlock label="Le/La caissier(e)" showBlank />
      </View>
    </View>
  );
}

export function PaymentReceiptDocument({ data }: { data: PaymentReceiptData }) {
  return (
    <Document title={`Reçu de paiement : ${data.classroomName}`} author={data.school.name}>
      <Page size="A4" orientation="portrait" style={s.page}>
        <ReceiptBlock data={data} copyLabel="Exemplaire école (souche)" />
        <View style={ls.separator} />
        <ReceiptBlock data={data} copyLabel="Exemplaire parent (copie)" />
        <PageFooter />
      </Page>
    </Document>
  );
}

export default PaymentReceiptDocument;
