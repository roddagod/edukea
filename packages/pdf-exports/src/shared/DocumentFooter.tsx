import { View, Text, Image } from '@react-pdf/renderer';
import { commonStyles as s, BRAND } from './styles';

interface SignatureProps {
  label?: string; // "Le/La caissier(e)", "Directeur des Etudes"
  signatureUrl?: string | null;
  showBlank?: boolean;
}

export function SignatureBlock({ label = 'Le/La caissier(e)', signatureUrl, showBlank = true }: SignatureProps) {
  return (
    <View style={s.signatureBlock}>
      <Text>{label}</Text>
      {signatureUrl ? (
        <Image src={signatureUrl} style={{ width: 90, height: 40, marginTop: 4, objectFit: 'contain' }} />
      ) : showBlank ? (
        <View style={{ height: 40 }} />
      ) : null}
    </View>
  );
}

export function FooterNote({ children }: { children: React.ReactNode }) {
  return <Text style={s.footerNote}>{children}</Text>;
}

export function PageFooter() {
  return (
    <Text
      style={{
        position: 'absolute',
        bottom: 12,
        left: 32,
        right: 32,
        fontSize: 7,
        color: BRAND.ink3,
        textAlign: 'center',
      }}
      fixed
      render={({ pageNumber, totalPages }) =>
        `Édité via Edukea · Page ${pageNumber} / ${totalPages}`
      }
    />
  );
}
