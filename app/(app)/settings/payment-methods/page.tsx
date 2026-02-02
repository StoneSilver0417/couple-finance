import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PaymentMethodsClient from "./payment-methods-client";

export const metadata = {
  title: "결제 수단 - 설정",
};

export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    redirect("/onboarding");
  }

  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("display_order", { ascending: true });

  return <PaymentMethodsClient paymentMethods={paymentMethods || []} />;
}
