import { redirect } from "next/navigation";
import { getCurrentUser, getPostAuthRedirect } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? getPostAuthRedirect(user) : "/auth/sign-in");
}
