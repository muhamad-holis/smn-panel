import { createServiceClient } from "@/lib/supabase/server";

/**
 * Supabase (lewat PostgREST) punya batas default MAKSIMAL 1000 baris per
 * request. Kalau sebuah query .select() tidak diberi .range(), hasil di atas
 * batas itu akan TERPOTONG DIAM-DIAM tanpa error apapun. Karena tabel
 * `services` sudah berisi 1000+ baris, query tanpa pagination menyebabkan
 * sebagian layanan (termasuk beberapa kategori, mis. TikTok) hilang dari
 * tampilan meskipun datanya tersimpan lengkap di database.
 *
 * Fungsi ini mengambil SEMUA baris dengan membaca per halaman (page) sampai
 * halaman terakhir yang jumlahnya kurang dari PAGE_SIZE.
 */
const PAGE_SIZE = 1000;

export async function fetchAllServices<T extends Record<string, any>>(
  columns: string,
  opts: { onlyActive?: boolean; category?: string } = {}
): Promise<T[]> {
  const supabase = createServiceClient();
  const all: T[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("services")
      .select(columns)
      .order("category", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (opts.onlyActive) query = query.eq("is_active", true);
    if (opts.category) query = query.eq("category", opts.category);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}
