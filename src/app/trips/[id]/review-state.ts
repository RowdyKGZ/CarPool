export type ReviewState = {
  error: string | null;
  fieldErrors: {
    rating?: string;
    comment?: string;
  };
};

export const initialReviewState: ReviewState = {
  error: null,
  fieldErrors: {},
};
