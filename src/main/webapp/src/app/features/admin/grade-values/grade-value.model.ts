export interface GradeValue {
  id: string;
  gradeCode: string;
  gradeType: string | null;
  displayName: string | null;
  monthlyValue: number | null;
  minSalary: number | null;
  maxSalary: number | null;
  sortOrder: number | null;
  active: boolean;
  inUse: boolean;
}

export interface GradeValueFormData {
  gradeCode: string;
  gradeType: string;
  displayName: string;
  monthlyValue: number | null;
  minSalary: number | null;
  maxSalary: number | null;
  sortOrder: number | null;
  active: boolean;
}
