export type BookingState = {
  message: string | null;
  fieldErrors: {
    seatsRequested?: string;
    note?: string;
  };
};

export const initialBookingState: BookingState = {
  message: null,
  fieldErrors: {},
};
