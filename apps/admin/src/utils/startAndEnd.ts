import moment from "moment";

export function getStartAndEndOfWeek(today, week) {
  const indexDay = today.getDay();
  //first date of previous week
  const startDay =
    today.getDate() - indexDay + (indexDay === 0 ? -6 : 1) - week * 7;
  const endDay =
    today.getDate() - indexDay + (indexDay === 0 ? -6 : 1) + 6 - week * 7;

  const temp1 = new Date().setDate(startDay);
  const temp2 = new Date().setDate(endDay);

  const firstDayOfWeek = moment(temp1).startOf("day").toDate();
  const lastDayOfWeek = moment(temp2).endOf("day").toDate();
  return [firstDayOfWeek, lastDayOfWeek];
}

export function getStartAndEndOfMonth(today, index) {
  const startDay = new Date(today.getFullYear(), today.getMonth() - index, 1);
  const endDay = new Date(today.getFullYear(), today.getMonth() - index + 1, 0);
  const firstDayOfMonth = moment(startDay).startOf("day").toDate();
  const lastDayOfMonth = moment(endDay).endOf("day").toDate();
  return [firstDayOfMonth, lastDayOfMonth];
}

export function getStartAndEndOfYear(today, index) {
  const startDay = new Date(today.getFullYear() - index, 0, 1);
  const endDay = new Date(today.getFullYear() + 1 - index, -1, 31);
  const firstDayOfYear = moment(startDay).startOf("day").toDate();
  const lastDayOfYear = moment(endDay).endOf("day").toDate();
  return [firstDayOfYear, lastDayOfYear];
}
