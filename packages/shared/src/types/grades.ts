import type { Tables } from './database.types';

export interface SubjectWithGroup extends Tables<'subjects'> {
  group: Tables<'subject_groups'>;
}

export interface EvaluationWithSubject extends Tables<'evaluations'> {
  classroom_subject: {
    subject: Tables<'subjects'>;
    classroom: Tables<'classrooms'>;
  };
}

export interface NoteWithEvaluation extends Tables<'notes'> {
  evaluation: EvaluationWithSubject;
}

export interface BulletinSubjectDetail extends Tables<'bulletin_subjects'> {
  subject: SubjectWithGroup;
}

export interface BulletinFull extends Tables<'bulletins'> {
  periode: Tables<'periodes'>;
  student: Tables<'students'>;
  classroom: Tables<'classrooms'>;
  subjects: BulletinSubjectDetail[];
}

export interface GradesSummary {
  subjectName: string;
  lastScore: number | null;
  maxScore: number;
  average: number | null;
  coefficient: number;
}
