/**
 * Membersihkan simbol dekoratif/catatan internal reseller (⚠️ peringatan,
 * 💧 indikasi kualitas "watered-down", ♻️ refill, 🚫, ⭐, 🔥, ⚡, dsb.) dari
 * nama & kategori layanan yang dikirim provider.
 *
 * Emoji BENDERA NEGARA (mis. 🇮🇩) SENGAJA tidak dihapus karena itu informasi
 * yang relevan buat customer (menunjukkan target lokasi layanan), bukan
 * catatan kualitas internal.
 *
 * Cara kerja: bendera dibentuk dari 2 "regional indicator symbol" berurutan
 * (U+1F1E6–U+1F1FF). Emoji lain yang mau dihapus ada di rentang Unicode
 * emoji umum (U+1F300–U+1FAFF, U+2600–U+27BF, U+2B00–U+2BFF, dsb). Supaya
 * bendera tidak ikut kehapus, teks dipecah per pasangan regional-indicator
 * dulu, baru sisanya disaring dari emoji non-bendera.
 */
const REGIONAL_INDICATOR = /[\u{1F1E6}-\u{1F1FF}]/gu;
const DECORATIVE_EMOJI =
  /[\u{2600}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1FAFF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{FE0F}\u{200D}]/gu;

export function cleanServiceText(text: string): string {
  if (!text) return text;

  // Lindungi pasangan regional-indicator (bendera) dengan placeholder sementara
  const flags: string[] = [];
  const protectedText = text.replace(/(\p{Regional_Indicator}{2})/gu, (match) => {
    flags.push(match);
    return `__FLAG_${flags.length - 1}__`;
  });

  // Hapus emoji dekoratif lain di luar bendera
  let cleaned = protectedText.replace(DECORATIVE_EMOJI, "");

  // Kembalikan bendera yang dilindungi tadi
  cleaned = cleaned.replace(/__FLAG_(\d+)__/g, (_, i) => flags[Number(i)]);

  // Rapikan spasi ganda bekas emoji yang dihapus
  return cleaned.replace(/\s{2,}/g, " ").trim();
}
