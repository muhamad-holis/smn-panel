import { createServiceClient } from "@/lib/supabase/server";

/**
 * Supabase (lewat PostgREST) punya batas MAKSIMAL baris per request (server-side
 * "max rows" setting). Kalau query .select() tidak diberi .range() sama sekali,
 * hasil di atas batas itu TERPOTONG DIAM-DIAM tanpa error apapun.
 *
 * PENTING: batas itu tetap berlaku SEKALIPUN kita sudah pakai .range() — kalau
 * kita minta .range(0, 999) (1000 baris) tapi batas asli server cuma 500, PostgREST
 * cuma akan balikin 500 baris, bukan error. Karena itu, kita TIDAK BOLEH
 * menyimpulkan "ini halaman terakhir" hanya karena hasil yang balik < ukuran yang
 * kita minta (PAGE_SIZE) — bisa jadi itu cuma batas asli server yang lebih kecil,
 * bukan berarti datanya sudah habis. Loop di bawah terus lanjut mengambil halaman
 * berikutnya berdasarkan JUMLAH BARIS YANG BENAR-BENAR BALIK (bukan asumsi
 * PAGE_SIZE), dan baru berhenti kalau satu halaman balik BENAR-BENAR KOSONG (0
 * baris) — supaya aman berapa pun batas asli server-nya.
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
      .order("id", { ascending: true }) // tie-breaker biar urutan antar-halaman stabil & tidak ada baris yang terlewat/dobel
      .range(from, from + PAGE_SIZE - 1);

    if (opts.onlyActive) query = query.eq("is_active", true);
    if (opts.category) query = query.eq("category", opts.category);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as T[]));
    from += data.length; // maju sesuai jumlah baris yang BENAR-BENAR balik, bukan asumsi PAGE_SIZE
  }

  return all;
}
