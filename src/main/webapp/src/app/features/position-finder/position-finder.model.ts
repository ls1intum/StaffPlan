export interface PositionFinderRequest {
  startDate: string;
  endDate: string;
  employeeGrade: string;
  fillPercentage: number;
  researchGroupId?: string | null;
}

export type MatchQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface PositionMatch {
  positionId: string;
  objectId: string;
  objectCode: string | null;
  objectDescription: string | null;
  positionGrade: string;
  positionPercentage: number | null;
  availablePercentage: number;
  positionStartDate: string | null;
  positionEndDate: string | null;
  overallScore: number;
  matchQuality: MatchQuality;
  wasteAmount: number;
  wastePercentage: number;
  currentAssignmentCount: number;
  warnings: string[];
}

export interface PositionFinderResponse {
  employeeMonthlyCost: number;
  employeeGrade: string;
  fillPercentage: number;
  totalMatchesFound: number;
  matches: PositionMatch[];
}
