import { redirect } from "next/navigation";

export default async function TransactionsPage() {
  // Always redirect to current month's calendar view
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  redirect(`/transactions/${yearMonth}`);
}
