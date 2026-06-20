"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { createReview } from "@/server/reviews/mutations";
import { reviewCreateSchema } from "@/server/reviews/schema";
import type { ReviewState } from "./review-state";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_PARTICIPANT: ruContent.review.notParticipant,
  ALREADY_REVIEWED: ruContent.review.alreadyReviewed,
  TRIP_NOT_COMPLETED: ruContent.review.notParticipant,
  SELF: ruContent.review.notParticipant,
  NOT_FOUND: ruContent.review.error,
  UNKNOWN: ruContent.review.error,
};

export async function createReviewAction(
  _prevState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  const parsed = reviewCreateSchema.safeParse({
    tripId: String(formData.get("tripId") ?? ""),
    targetUserId: String(formData.get("targetUserId") ?? ""),
    rating: String(formData.get("rating") ?? "0"),
    comment: String(formData.get("comment") ?? ""),
  });

  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      error: null,
      fieldErrors: { rating: fe.rating?.[0], comment: fe.comment?.[0] },
    };
  }

  const result = await createReview(session.user.id, parsed.data);
  if (!result.ok) {
    return { error: ERROR_MESSAGES[result.reason], fieldErrors: {} };
  }

  redirect(`/trips/${parsed.data.tripId}`);
}
