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
      return "bg-green-100 text-green-700";
    case "Partial":
      return "bg-yellow-100 text-yellow-700";
    case "In progress":
    case "Processing":
      return "bg-blue-100 text-blue-700";
    case "Canceled":
    case "Error":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function slugifyCategory(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}
