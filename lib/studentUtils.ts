
import { Student } from '../types';

export const getFamilyId = (s: Student): string => {
  const hasInvalidGuardian = !s.guardian || s.guardian === '***' || s.guardian.trim() === '';
  const hasInvalidWhatsapp = !s.whatsapp || s.whatsapp === '***' || s.whatsapp.trim() === '';
  
  if (hasInvalidGuardian || hasInvalidWhatsapp) {
    // Individual student - use their own ID as familyId to keep them separate
    return s.id;
  }
  
  // Family is defined by same last name
  return `FAM-${s.lastName.toUpperCase().trim()}`;
};

export const regroupStudents = (students: Student[]): Student[] => {
  return students.map(s => ({
    ...s,
    familyId: getFamilyId(s)
  }));
};
