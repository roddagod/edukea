import { View, Text, Image } from '@react-pdf/renderer';
import type { SchoolInfo, YearRef } from '../types';
import { commonStyles as s, BRAND } from './styles';

interface Props {
  school: SchoolInfo;
  year?: YearRef;
  /** Titre encadre au centre (ex: "LISTE DE CLASSE : CM2 A") */
  title?: string;
  /** Bloc droit optionnel (ex: date, total eleves) */
  rightBlock?: React.ReactNode;
}

/**
 * En-tete standard des documents Edukea :
 * - Gauche  : logo + nom ecole + adresse + tel + email
 * - Centre  : titre encadre (ex: "LISTE DE CLASSE")
 * - Droite  : bloc metadonnees (annee, date, total)
 */
export function SchoolHeader({ school, year, title, rightBlock }: Props) {
  const displayName = school.displayName ?? school.name;

  return (
    <View style={s.headerRow}>
      {/* Bloc ecole (gauche) */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        {school.logoUrl ? (
          <Image src={school.logoUrl} style={{ width: 46, height: 46, objectFit: 'contain' }} />
        ) : (
          <View style={{ width: 46, height: 46, borderWidth: 1, borderColor: BRAND.line, borderStyle: 'solid' }} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND.navy }}>{displayName}</Text>
          {school.address && <Text style={{ fontSize: 8, color: BRAND.ink3 }}>{school.address}</Text>}
          {school.postalAddress && <Text style={{ fontSize: 8, color: BRAND.ink3 }}>{school.postalAddress}</Text>}
          {school.phone && <Text style={{ fontSize: 8, color: BRAND.ink3 }}>Tel : {school.phone}</Text>}
          {school.email && <Text style={{ fontSize: 8, color: BRAND.ink3 }}>Email : {school.email}</Text>}
        </View>
      </View>

      {/* Titre encadre */}
      {title && (
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={s.titleBox}>
            <Text style={s.titleText}>{title}</Text>
          </View>
        </View>
      )}

      {/* Bloc droit */}
      {(year || rightBlock) && (
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {year && (
            <>
              <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: BRAND.navy }}>ANNÉE SCOLAIRE</Text>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{year.name}</Text>
            </>
          )}
          {rightBlock}
        </View>
      )}
    </View>
  );
}

/**
 * Bloc "identite institutionnelle" pour les recus (encadre, sur le cote droit) :
 *   Republique de Cote d'Ivoire
 *   -----------
 *   Union-Discipline-Travail
 *   ANNEE SCOLAIRE : 2026-2027
 */
export function InstitutionalBlock({ school, year }: { school: SchoolInfo; year?: YearRef }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: BRAND.ink,
        borderStyle: 'solid',
        padding: 6,
        alignItems: 'center',
        minWidth: 180,
      }}
    >
      <Text style={{ fontSize: 9 }}>République de {school.countryLabel ?? "Côte d'Ivoire"}</Text>
      <Text style={{ fontSize: 9, marginVertical: 2 }}>-------------</Text>
      <Text style={{ fontSize: 9 }}>{school.motto ?? 'Union-Discipline-Travail'}</Text>
      {year && (
        <Text style={{ fontSize: 9, marginTop: 4, fontFamily: 'Helvetica-Bold' }}>
          ANNÉE SCOLAIRE : {year.name}
        </Text>
      )}
    </View>
  );
}
