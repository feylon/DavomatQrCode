import { dayBounds, periodBounds } from './date-range';

describe('dayBounds', () => {
  it('kun boshi va oxirini qaytaradi', () => {
    const { start, end } = dayBounds(new Date(2026, 1, 3, 14, 25));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMilliseconds()).toBe(999);
    expect(start.getDate()).toBe(3);
    expect(end.getDate()).toBe(3);
  });

  it('kiritilgan sanani o\'zgartirmaydi', () => {
    const d = new Date(2026, 1, 3, 14, 25);
    dayBounds(d);
    expect(d.getHours()).toBe(14);
  });
});

describe('periodBounds', () => {
  it('oraliqni to\'liq kunlar bilan qaytaradi', () => {
    const { start, end } = periodBounds(new Date(2026, 1, 1, 10), new Date(2026, 1, 5, 9));
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(end.getDate()).toBe(5);
    expect(end.getHours()).toBe(23);
  });
});
