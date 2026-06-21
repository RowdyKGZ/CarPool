export type ReportState = {
  error: string | null;
  done: boolean;
};

export const initialReportState: ReportState = {
  error: null,
  done: false,
};
