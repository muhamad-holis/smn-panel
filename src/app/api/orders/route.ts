import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { provider } from "@/lib/provider";
import { calcCharge } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const body = await req.json();
  const { service_id, link, quantity } = body as { service_id: number; link: string; quantity: number };

  if (!service_id || !link || !quantity) {
    return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("*")
    .eq("id", service_id)
    .eq("is_active", true)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: "Layanan tidak ditemukan." }, { status: 404 });
  }

  if (quantity < service.min_order || quantity > service.max_order) {
    return NextResponse.json(
      { error: `Jumlah harus antara ${service.min_order} - ${service.max_order}` },
      { status: 400 }
    );
  }

  const charge = calcCharge(service.sell_rate, quantity);
  const cost = Math.ceil((service.cost_rate / 1000) * quantity);

  // Pakai service-role client supaya insert order + potong saldo bisa dilakukan dalam satu alur konsisten,
  // walau RLS profiles/orders tetap membatasi apa yang boleh dibaca user dari client biasa.
  const admin = createServiceClient();

  // Potong saldo dulu secara atomik (RPC akan gagal kalau saldo tidak cukup)
  try {
    await admin.rpc("adjust_balance", {
      p_user_id: user.id,
      p_amount: -charge,
      p_type: "order",
      p_reference: null,
      p_description: `Order ${service.name} x${quantity}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Saldo tidak mencukupi." }, { status: 400 });
  }

  // Buat order awal berstatus Pending sebelum panggil provider
  const { data: order, error: insertError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      service_id: service.id,
      link,
      quantity,
      charge,
      cost,
      status: "Pending",
    })
    .select()
    .single();

  if (insertError || !order) {
    // rollback saldo jika gagal insert
    await admin.rpc("adjust_balance", {
      p_user_id: user.id,
      p_amount: charge,
      p_type: "refund",
      p_reference: null,
      p_description: "Rollback: gagal membuat order",
    });
    return NextResponse.json({ error: "Gagal membuat order." }, { status: 500 });
  }

  // Panggil provider
  try {
    const result = await provider.addOrder({
      service: service.provider_service_id,
      link,
      quantity,
    });

    if ("error" in result) {
      // refund + tandai error
      await admin.rpc("adjust_balance", {
        p_user_id: user.id,
        p_amount: charge,
        p_type: "refund",
        p_reference: String(order.id),
        p_description: `Refund: provider error - ${result.error}`,
      });
      await admin.from("orders").update({ status: "Error", provider_response: result }).eq("id", order.id);

      return NextResponse.json({ error: `Provider menolak order: ${result.error}` }, { status: 502 });
    }

    await admin
      .from("orders")
      .update({
        provider_order_id: result.order,
        status: "Processing",
        provider_response: result,
      })
      .eq("id", order.id);

    return NextResponse.json({ order: { ...order, provider_order_id: result.order, status: "Processing" } });
  } catch (e: any) {
    await admin.rpc("adjust_balance", {
      p_user_id: user.id,
      p_amount: charge,
      p_type: "refund",
      p_reference: String(order.id),
      p_description: "Refund: provider tidak dapat dihubungi",
    });
    await admin.from("orders").update({ status: "Error" }).eq("id", order.id);

    return NextResponse.json({ error: "Provider sedang tidak dapat dihubungi. Saldo sudah dikembalikan." }, { status: 502 });
  }
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: orders } = await supabase
    .from("orders")
    .select("*, services(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders });
}
