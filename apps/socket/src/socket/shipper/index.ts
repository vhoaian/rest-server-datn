import config from "../../config";
import { TAG_LOG_ERROR } from "../TAG_EVENT";

const isLog = config.LOG_SOCKET.indexOf("shipper") > -1 ? true : false;

const SHIPPER_DEFAULT = {
  id: null,
  socketID: null,
  coor: { lat: 0, lng: 0 },
  currentOrderConfirm: 0,
  maximumOrder: 1,
};

let listShipperOnline = [];

// Log list customer online
if (isLog)
  setInterval(() => {
    console.log("LIST SHIPPER ONLINE");
    console.table(listShipperOnline);
  }, 5000);

export const getShipper = (id) => {
  // @ts-expect-error
  const indexOf = listShipperOnline.map((shipper) => shipper.id).indexOf(id);
  if (indexOf < 0) return null;

  return listShipperOnline[indexOf];
};

export const addShipper = (id, socketID, coor) => {
  // @ts-expect-error
  listShipperOnline.push({ id, socketID, coor });
};

export const removeShipper = (id) => {
  const newListShipperOnline = listShipperOnline.filter((shipper) => {
    // @ts-expect-error
    return shipper.id !== id ? shipper : null;
  });

  listShipperOnline = newListShipperOnline;
};

export const updateShipperCoor = (id, coor) => {
  // @ts-expect-error
  const indexOf = listShipperOnline.map((shipper) => shipper.id).indexOf(id);
  if (indexOf < 0) return null;

  // @ts-expect-error
  listShipperOnline[indexOf].coor = coor;
};

export const pickShipper = (orderID) => {
  // Algorithm pick shipper and return array

  return [];
};
