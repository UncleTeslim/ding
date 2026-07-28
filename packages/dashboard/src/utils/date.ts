const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

export function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : todayDateInputValue();
}

export function toPublicationIso(date: string) {
  return new Date(`${date}T12:00:00.000Z`).toISOString();
}

export function formatShortDate(value: string | null) {
  if (!value) return "No date";
  return shortDateFormatter.format(new Date(value));
}
