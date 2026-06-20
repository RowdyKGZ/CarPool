import { ruContent } from "@/lib/content/ru";
import { ReviewForm } from "./review-form";

const c = ruContent.review;

type CompletedPassenger = {
  passengerId: string;
  passenger: { name: string };
};

function ReviewedCard({ name, rating }: { name: string; rating: number }) {
  return (
    <div className="rounded-3xl border border-line bg-surface-strong p-4 sm:p-5">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="mt-1 text-sm text-muted">
        {c.done} · {c.yourRating}: {rating} ★
      </p>
    </div>
  );
}

export function ReviewsSection({
  tripId,
  isDriver,
  driver,
  iRode,
  completedPassengers,
  reviewed,
}: {
  tripId: string;
  isDriver: boolean;
  driver: { id: string; name: string };
  iRode: boolean;
  completedPassengers: CompletedPassenger[];
  reviewed: { targetUserId: string; rating: number }[];
}) {
  const reviewedMap = new Map(reviewed.map((r) => [r.targetUserId, r.rating]));

  // Passenger who didn't actually ride has nobody to review.
  if (!isDriver && !iRode) return null;

  const title = isDriver ? c.driverSectionTitle : c.passengerSectionTitle;

  return (
    <div>
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
        {title}
      </p>

      {isDriver ? (
        completedPassengers.length === 0 ? (
          <p className="text-sm text-muted">{c.noPassengers}</p>
        ) : (
          <div className="space-y-3">
            {completedPassengers.map((p) =>
              reviewedMap.has(p.passengerId) ? (
                <ReviewedCard
                  key={p.passengerId}
                  name={p.passenger.name}
                  rating={reviewedMap.get(p.passengerId)!}
                />
              ) : (
                <ReviewForm
                  key={p.passengerId}
                  tripId={tripId}
                  targetUserId={p.passengerId}
                  targetName={p.passenger.name}
                />
              ),
            )}
          </div>
        )
      ) : reviewedMap.has(driver.id) ? (
        <ReviewedCard name={driver.name} rating={reviewedMap.get(driver.id)!} />
      ) : (
        <ReviewForm
          tripId={tripId}
          targetUserId={driver.id}
          targetName={driver.name}
        />
      )}
    </div>
  );
}
