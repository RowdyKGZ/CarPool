export type TripTemplateFieldName =
  | "title"
  | "pickupLabel"
  | "dropoffLabel"
  | "departureTime"
  | "pricePerSeat"
  | "totalSeats"
  | "comment";

export type TripTemplateFormState = {
  message: string | null;
  fieldErrors: Partial<Record<TripTemplateFieldName, string>>;
};

export const initialTripTemplateFormState: TripTemplateFormState = {
  message: null,
  fieldErrors: {},
};

export type TripTemplateFormDefaults = {
  title?: string;
  fromDistrict?: string;
  toDistrict?: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  departureTime?: string;
  pricePerSeat?: number;
  totalSeats?: number;
  comment?: string;
};
