import {
  addDays,
  addMinutes,
  differenceInMinutes,
  format,
  isSameDay,
  parse,
  parseISO,
  startOfDay,
} from "date-fns";
import type { DayOfWeek } from "./types";

/** "09:30" -> 570 minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 570 -> "09:30" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Minutes since midnight for a Date, in local time. */
export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function dayOfWeek(date: Date): DayOfWeek {
  return date.getDay() as DayOfWeek;
}

/** Combine a calendar day and a "HH:mm" string into a Date. */
export function atTime(day: Date, time: string): Date {
  return parse(time, "HH:mm", startOfDay(day));
}

export function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export const fmt = {
  time: (d: Date | string) => format(toDate(d), "h:mm a"),
  timeRange: (start: Date | string, end: Date | string) =>
    `${format(toDate(start), "h:mm")}–${format(toDate(end), "h:mm a")}`,
  weekday: (d: Date | string) => format(toDate(d), "EEEE"),
  weekdayShort: (d: Date | string) => format(toDate(d), "EEE"),
  dayMonth: (d: Date | string) => format(toDate(d), "d MMM"),
  fullDate: (d: Date | string) => format(toDate(d), "EEEE, d MMMM yyyy"),
  mediumDate: (d: Date | string) => format(toDate(d), "d MMM yyyy"),
  monthYear: (d: Date | string) => format(toDate(d), "MMMM yyyy"),
  isoDate: (d: Date | string) => format(toDate(d), "yyyy-MM-dd"),
  relativeDay: (d: Date | string) => {
    const date = toDate(d);
    const today = startOfDay(new Date());
    const diff = differenceInMinutes(startOfDay(date), today) / (60 * 24);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return format(date, "EEE, d MMM");
  },
};

export function toDate(d: Date | string): Date {
  return typeof d === "string" ? parseISO(d) : d;
}

export {
  addDays,
  addMinutes,
  differenceInMinutes,
  format,
  isSameDay,
  parseISO,
  startOfDay,
};
