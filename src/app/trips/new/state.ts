export type TripNewFieldName =
  | "pickupLabel"
  | "dropoffLabel"
  | "departureAt"
  | "pricePerSeat"
  | "totalSeats"
  | "comment";

export type TripNewState = {
  message: string | null;
  fieldErrors: Partial<Record<TripNewFieldName, string>>;
};

export const initialTripNewState: TripNewState = {
  message: null,
  fieldErrors: {},
};
