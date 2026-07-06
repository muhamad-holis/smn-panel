import { fetchAllServices } from "@/lib/fetch-all-services";
import OrderForm from "./order-form";

export default async function OrderPage({
  searchParams,
}: {
  searchParams: { service?: string };
}) {
  const services = await fetchAllServices(
    "id, name, category, sell_rate, min_order, max_order, refill, cancel, description",
    { onlyActive: true }
  );

  const initialServiceId = searchParams?.service ? Number(searchParams.service) : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Buat Order Baru</h1>
      <OrderForm services={services || []} initialServiceId={initialServiceId} />
    </div>
  );
}
