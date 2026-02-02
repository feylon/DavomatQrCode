// Berilgan sananing boshlanishi (00:00:00.000) va oxiri (23:59:59.999) — server vaqt mintaqasida
export function dayBounds(date: Date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Ikki sana oralig'i (ikkala kun ham to'liq kiradi)
export function periodBounds(from: Date, to: Date) {
  return { start: dayBounds(from).start, end: dayBounds(to).end };
}
