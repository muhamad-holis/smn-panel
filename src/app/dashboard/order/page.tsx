import { createClient } from "@/lib/supabase/server";
import OrderForm from "./order-form";

export default async function OrderPage() {
  const supabase = createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, category, sell_rate, min_order, max_order, refill, cancel, description")
    .eq("is_active", true)
    .order("category", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Buat Order Baru</h1>
      <OrderForm services={services || []} />
    </div>
  );
}
