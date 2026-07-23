export interface IExperience {
  company: string;
  location?: string;
  workplace?: string;
  employmentType?: string;
  jobTitle: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  isActive?: boolean;
}
