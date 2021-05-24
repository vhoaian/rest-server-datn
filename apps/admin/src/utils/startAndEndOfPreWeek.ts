import moment from "moment";

export function getStartAndEndOfPreWeek(today) {
  const presentDay = new Date(today);
  const indexDay = presentDay.getDay();
  //first date of previous week
  const startDay =
    presentDay.getDate() - indexDay + (indexDay === 0 ? -6 : 1) - 7;
  const endDay =
    presentDay.getDate() - indexDay + (indexDay === 0 ? -6 : 1) - 1;

  const temp1 = new Date().setDate(startDay);
  const temp2 = new Date().setDate(endDay);

  const firstDateOfWeek = moment(temp1).startOf("day").toDate();
  const lastDateOfWeek = moment(temp2).endOf("day").toDate();
  return [firstDateOfWeek, lastDateOfWeek];
}
