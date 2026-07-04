export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/** Hitung harga jual per 1000 dari harga modal + markup persen */
export function applyMarkup(costRate: number, markupPercent: number): number {
  return Math.ceil(costRate * (1 + markupPercent / 100));
}

/** Hitung total charge untuk quantity tertentu, dibulatkan ke atas ke kelipatan 50 biar rapi */
export function calcCharge(sellRatePer1000: number, quantity: number): number {
  const raw = (sellRatePer1000 / 1000) * quantity;
  return Math.ceil(raw / 50) * 50;
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "Completed":
      return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20";
    case "Partial":
      return "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20";
    case "In progress":
    case "Processing":
      return "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20";
    case "Canceled":
    case "Error":
      return "bg-red-500/10 text-red-400 ring-1 ring-red-500/20";
    default:
      return "bg-navy-800 text-navy-300 ring-1 ring-navy-700";
  }
}

export function slugifyCategory(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}
