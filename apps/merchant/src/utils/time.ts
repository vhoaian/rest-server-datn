import moment from "moment";

export function getDateFromTimeString(input: string): Date | null {
  const tokens = input.split(":");
  if (tokens.length != 2) return null;
  const [hour, minute] = tokens.map(Number);
  if (hour > 23 || hour < 0 || minute > 59 || minute < 0) return null;
  return moment.parseZone(`${hour}:${minute} +07:00`, "H:m Z").toDate();
}
