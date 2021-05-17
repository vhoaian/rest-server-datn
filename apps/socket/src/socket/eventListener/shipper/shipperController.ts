import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import config from "../../../config";
import { TAG_EVENT, TAG_LOG_ERROR } from "../../TAG_EVENT";
import { calcDistanceBetween2Coor } from "../../../utils/calcDistance";
import * as orderController from "../order";

const SHIPPER_DEFAULT = {
  id: null,
  socketID: null,
  coor: { lat: 0, lng: 0 },
  listOrderID: [],
  beingRequested: false,
  maximumOrder: 2,
  maximumDistance: 10, // unit: km
  seftDestruct: null,
};

let _listShipperOnline: any = [];
let _io: any = null;
export const setIO = (io) => {
  _io = io;
};

// [LOG]: Log list customer online every 5 seconds
if (config.LOG_SOCKET.indexOf("shipper") > -1) {
  setInterval(() => {
    console.log("LIST SHIPPER ONLINE");
    console.table(_listShipperOnline);
  }, 5000);
}

// create new shipper
const createShipper = (id, socketID, coor) => {
  // @ts-expect-error
  return { ...SHIPPER_DEFAULT.clone(), id, socketID, coor };
};

// ============================ EXPORT ============================ //
// Get Shipper
export const getShipper = (id) => {
  const indexOf = _listShipperOnline.map((shipper) => shipper.id).indexOf(id);
  if (indexOf < 0) return null;

  return _listShipperOnline[indexOf];
};

export const getShipperBySocketID = (socketID) => {
  const indexOf = _listShipperOnline
    .map((shipper: any) => shipper.socketID)
    .indexOf(socketID);
  if (indexOf < 0) return null;

  return _listShipperOnline[indexOf];
};

// Add shipper
export const addShipper = (id, socketID, coor) => {
  // auto reconnect
  const shipper: any = getShipper(id);
  if (shipper) {
    shipper.socketID = socketID;
    shipper.coor = coor;
    clearTimeout(shipper.seftDestruct);
    shipper.seftDestruct = null;

    // send all order if shipper has order before
    const listOrder = orderController
      .getOrderByShipperID(id)
      .map((order) => ({ ...order, id: order.orderID }));

    _io
      .to(socketID)
      .emit(
        TAG_EVENT.RESPONSE_SHIPPER_RECONNECT,
        normalizeResponse("Reconnect", { listOrder })
      );
    return;
  }

  _listShipperOnline.push(createShipper(id, socketID, coor));
};

// Remove shipper
export const removeShipper = (id) => {
  const MAXIMUM_TIME_DESTRUCT = 60 * 1000;

  const index = _listShipperOnline.map((shipper) => shipper.id).indexOf(id);
  if (index < 0)
    return console.log(
      `[${TAG_LOG_ERROR}_REMOVE_SHIPPER]: shipper does not exits`
    );

  // Set timeout to seft destruct
  const shipper = _listShipperOnline[index];

  shipper.seftDestruct = setTimeout(() => {
    _listShipperOnline.splice(index, 1);
  }, MAXIMUM_TIME_DESTRUCT);
};

// Update Shipper Coor. Return new coor
export const updateShipperCoor = (id, coor) => {
  const indexOf = _listShipperOnline.map((shipper) => shipper.id).indexOf(id);
  if (indexOf < 0) return null;

  _listShipperOnline[indexOf].coor = coor;

  // Invoke event update coor shipper
  _listShipperOnline[indexOf].listOrderID.forEach((orderID) => {
    _io
      .to(orderID)
      .emit(
        TAG_EVENT.RESPONSE_SHIPPER_CHANGE_COOR,
        normalizeResponse("Update Coor Shipper", coor)
      );
  });
};

// Slect shippers to take order. Return array shipper
export const sendOrderToShipper = async (order, maxShipper) => {
  // Algorithm select shipper
  const maximumTimeDelay = 10 * 1000;

  // 1. Nearest: distance = Shipper -> Restaurant
  // 2. Rating:

  // Get coor merchant:
  const coorMerchant = { lat: 0, lng: 0 };

  do {
    const orderInController = orderController.getOrderByID(order.id);
    if (!orderInController) return;

    // Filter & Select shipper
    const listShipperSelected = _listShipperOnline
      .clone()
      // Filter shipper being requested
      .filter((shipper) => (shipper.beingRequested ? null : shipper))
      // Filter shipper refused previous request
      .filter((shipper) => {
        const index = orderInController.listShippersAreRequestedLv1.indexOf(
          shipper.id
        );
        if (index < 0) return shipper;
        return null;
      })
      // Filter shipper full order
      .filter((shipper) =>
        shipper.listOrderID.length < shipper.maximumOrder ? shipper : null
      )
      // Filter if distance is larger than shipper's expectation
      .filter((shipper) => {
        const coorShipper = { lat: 0, lng: 0 };

        const distanceShipper = calcDistanceBetween2Coor(
          coorMerchant,
          coorShipper
        );

        if (shipper.maximumDistance >= distanceShipper) return shipper;
        return null;
      })
      // Sort to get nearest shippers
      .sort((shipper1, shipper2) => {
        const coorShipper1 = { lat: 0, lng: 0 };
        const coorShipper2 = { lat: 0, lng: 0 };

        const distanceShipper1 = calcDistanceBetween2Coor(
          coorMerchant,
          coorShipper1
        );
        const distanceShipper2 = calcDistanceBetween2Coor(
          coorMerchant,
          coorShipper2
        );

        return distanceShipper1 > distanceShipper2 ? -1 : 1;
      })
      // <>
      // Add more rule to sort shipper
      // <>
      .slice(0, maxShipper);

    // Update listShipperAreRequested
    orderInController.listShippersAreRequestedLv2 =
      orderInController.listShippersAreRequestedLv1;

    orderInController.listShippersAreRequestedLv1 = listShipperSelected.map(
      (shipper) => shipper.id
    );

    // Send order to Shipper
    listShipperSelected.forEach((shipper) => {
      getShipperBySocketID(shipper.socketID).beingRequested = true;

      _io
        .to(shipper.socketID)
        .emit(
          TAG_EVENT.RESPONSE_SHIPPER_CONFIRM_ORDER,
          normalizeResponse("Confirm order", { ...order, maximumTimeDelay })
        );
    });

    console.log("LIST SHIPPER LENGHT:", listShipperSelected.length);

    await new Promise((res) => setTimeout(res, maximumTimeDelay + 1000));

    const orderBreak = orderController.getOrderByID(order.id);
    if (!orderBreak) break;
    if (orderBreak.shipperID) break;
  } while (true);
};

// Shipper => Checkin => socket

// Shipper confirm order
export const confirmOrder = async (orderID, socketID) => {
  // Update shipper
  const indexShipper = _listShipperOnline
    .map((shipper) => shipper.socketID)
    .indexOf(socketID);

  if (indexShipper < 0) return;

  const shipperID = _listShipperOnline[indexShipper].id;
  _listShipperOnline[indexShipper].beingRequested = false;

  // Check the order is there any shipper?
  if (!(await orderController.updateShipper(orderID, shipperID))) {
    _io
      .to(socketID)
      .emit(
        TAG_EVENT.RESPONSE_SHIPPER_CONFIRM_ORDER_FAILED,
        normalizeResponse(
          "Confirm order failed, the order already has shipper.",
          { orderID }
        )
      );

    return;
  }

  _listShipperOnline[indexShipper].listOrderID.push(orderID);

  // Update status order
  orderController.changeStatusOrder(
    orderID,
    shipperID,
    orderController.ORDER_STATUS.DURING_GET
  );
};

// Shipper confirm order
export const skipOrder = (orderID, socketID) => {
  console.log("SKIP ORDER");
  const shipper = getShipperBySocketID(socketID);
  if (!shipper) return;

  shipper.beingRequested = false;
};

// Shipper confirm order
export const cancelOrder = (orderID, socketID) => {
  // Update shipper
  const indexShipper = _listShipperOnline
    .map((shipper) => shipper.socketID)
    .indexOf(socketID);

  if (indexShipper < 0) return;

  const indexOrderID = _listShipperOnline[indexShipper].listOrderID.indexOf(
    orderID
  );
  _listShipperOnline[indexShipper].listOrderID.splice(indexOrderID, 1);

  // Update status order
  orderController.changeStatusOrder(
    orderID,
    _listShipperOnline[indexShipper].id,
    orderController.ORDER_STATUS.CANCEL_BY_SHIPPER
  );
};

// Shipper took food
export const tookFood = (orderID, shipperID) => {
  // Update status order
  orderController.changeStatusOrder(
    orderID,
    shipperID,
    orderController.ORDER_STATUS.DURING_SHIP
  );
};

// Shipper delivered
export const deliveredOrder = (orderID, socketID) => {
  // Update shipper
  const idxShipper = _listShipperOnline
    .map((shipper) => shipper.socketID)
    .indexOf(socketID);

  if (idxShipper < 0) return;
  let listOrderID = _listShipperOnline[idxShipper].listOrderID;

  _listShipperOnline[idxShipper].listOrderID = listOrderID.filter((_orderID) =>
    _orderID === orderID ? null : _orderID
  );

  // Update status order
  orderController.changeStatusOrder(
    orderID,
    _listShipperOnline[idxShipper].id,
    orderController.ORDER_STATUS.DELIVERED
  );
};
