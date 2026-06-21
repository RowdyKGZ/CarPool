import { UserRole } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** Returns the current user id if they are an ADMIN, otherwise null. */
export async function getAdminId(): Promise<string | null> {
  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === UserRole.ADMIN ? session.user.id : null;
}
