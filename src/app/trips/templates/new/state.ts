export type TripTemplateFieldName =
  | "title"
  | "pickupLabel"
  | "dropoffLabel"
  | "departureTime"
  | "pricePerSeat"
  | "totalSeats"
  | "comment";

export type TripTemplateNewState = {
  message: string | null;
  fieldErrors: Partial<Record<TripTemplateFieldName, string>>;
};

export const initialTripTemplateNewState: TripTemplateNewState = {
  message: null,
  fieldErrors: {},
};
