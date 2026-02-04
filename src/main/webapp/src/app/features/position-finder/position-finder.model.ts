export interface PositionFinderRequest {
  startDate: string;
  endDate: string;
  employeeGrade: string;
  fillPercentage: number;
  researchGroupId?: string | null;
  relevanceTypes?: string[] | null;
}

export type MatchQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface PositionMatch {
  positionId: string;
  objectId: string;
  objectCode: string | null;
  objectDescription: string | null;
  positionGrade: string;
  positionRelevanceType: string | null;
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

export interface SplitSuggestion {
  positions: PositionMatch[];
  totalAvailablePercentage: number;
  totalWasteAmount: number;
  splitCount: number;
}

export interface PositionFinderResponse {
  employeeMonthlyCost: number;
  employeeGrade: string;
  fillPercentage: number;
  totalMatchesFound: number;
  matches: PositionMatch[];
  splitSuggestions: SplitSuggestion[];
}
