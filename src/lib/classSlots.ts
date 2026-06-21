// Shared registry of weekly group-class slots.
// Used by the overview page, the user dashboard, and the checkout payload
// so the chosen class day flows through to Stripe, the database, and emails.

export type ClassSlot = {
  id: string;
  /** 0=Sun, 1=Mon, ... 4=Thu, 6=Sat */
  weekday: number;
  weekdayLabel: string;
  utcHour: number;
  utcMinute: number;
  /** Human-readable label shown in the picker, emails and admin dashboard. */
  label: string;
  /** When true, the option is shown but cannot be selected. */
  disabled?: boolean;
  /** Suffix shown after the label when disabled, e.g. "currently unavailable". */
  disabledLabel?: string;
};

export const CLASS_SLOTS: ClassSlot[] = [
  {
    id: "thu-1200-gmt",
    weekday: 4,
    weekdayLabel: "Thursday",
    utcHour: 12,
    utcMinute: 0,
    label: "Thursdays · 12:00 GMT",
  },
  {
    id: "sat-1100-gmt",
    weekday: 6,
    weekdayLabel: "Saturday",
    utcHour: 11,
    utcMinute: 0,
    label: "Saturdays · 11:00 GMT",
  },
];

export function getSlotById(id: string | null | undefined): ClassSlot | undefined {
  if (!id) return undefined;
  return CLASS_SLOTS.find((s) => s.id === id);
}

export const DEFAULT_SLOT_ID = "thu-1200-gmt";
