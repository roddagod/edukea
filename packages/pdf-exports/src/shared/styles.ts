import { StyleSheet } from '@react-pdf/renderer';

// =============================================================================
// Tokens Edukea (repliques de packages/ui/src/tokens/colors.ts)
// =============================================================================
export const BRAND = {
  primary:  '#E97423', // orange Edukea
  navy:     '#1D3A6B', // ink deep
  ink:      '#0F172A',
  ink2:     '#334155',
  ink3:     '#64748B',
  line:     '#E2E8F0',
  lineSoft: '#F1F5F9',
  danger:   '#DC2626',
  success:  '#059669',
} as const;

export const commonStyles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: BRAND.ink,
  },
  pagePortrait: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: BRAND.ink,
  },
  pageLandscape: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: BRAND.ink,
  },
  // ------ Header row ------
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: 1,
    borderBottomColor: BRAND.primary,
    borderBottomStyle: 'solid',
  },
  // ------ Titles ------
  titleBox: {
    borderWidth: 1,
    borderColor: BRAND.ink,
    borderStyle: 'solid',
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'center',
  },
  titleText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
    marginBottom: 6,
    marginTop: 10,
  },
  // ------ Tables ------
  table: {
    borderWidth: 1,
    borderColor: BRAND.ink,
    borderStyle: 'solid',
  },
  tRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.ink,
    borderBottomStyle: 'solid',
    minHeight: 20,
  },
  tRowLast: {
    flexDirection: 'row',
    minHeight: 20,
  },
  tHead: {
    flexDirection: 'row',
    backgroundColor: BRAND.lineSoft,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.ink,
    borderBottomStyle: 'solid',
    minHeight: 22,
  },
  th: {
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    borderRightWidth: 0.5,
    borderRightColor: BRAND.ink,
    borderRightStyle: 'solid',
  },
  td: {
    padding: 4,
    fontSize: 8.5,
    borderRightWidth: 0.5,
    borderRightColor: BRAND.ink,
    borderRightStyle: 'solid',
  },
  tdMono: {
    padding: 4,
    fontSize: 8.5,
    fontFamily: 'Courier',
    borderRightWidth: 0.5,
    borderRightColor: BRAND.ink,
    borderRightStyle: 'solid',
  },
  tdRight: {
    padding: 4,
    fontSize: 8.5,
    textAlign: 'right',
    borderRightWidth: 0.5,
    borderRightColor: BRAND.ink,
    borderRightStyle: 'solid',
  },
  tdBold: {
    padding: 4,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    borderRightWidth: 0.5,
    borderRightColor: BRAND.ink,
    borderRightStyle: 'solid',
  },
  // ------ Utility ------
  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },
  spacer4:  { height: 4 },
  spacer8:  { height: 8 },
  spacer12: { height: 12 },
  spacer20: { height: 20 },
  bold: { fontFamily: 'Helvetica-Bold' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  muted: { color: BRAND.ink3 },
  small: { fontSize: 7.5 },
  brandOrange: { color: BRAND.primary },
  brandNavy: { color: BRAND.navy },
  // Signature block
  signatureBlock: {
    marginTop: 24,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  footerNote: {
    marginTop: 20,
    fontSize: 8,
    color: BRAND.ink3,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
