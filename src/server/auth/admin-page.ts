import "server-only";
import { redirect } from "next/navigation";
import { session } from "./session";
import { actor } from "./staff";
export async function adminPage() {
  if (!(await session()).ownerId) redirect("/personel/logowanie");
  const a = await actor();
  if (!a.staff) redirect("/personel/logowanie");
  if (a.staff.role !== "ADMIN") redirect("/admin");
  return a;
}
