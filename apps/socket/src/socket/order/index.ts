const ORDER_STATUS = {
  WAITING: 0,
  COMING_TO_GET: 1,
  SHIPPING: 2,
  DELIVERED: 3,
};

const ORDER_DEFAULT = {
  orderID: null,
  shipperID: null,
  customerID: null,
  merchantID: null,
  status: null,
};

const newOrder = (orderID, customerID, merchantID, shipperID) => ({
  orderID,
  shipperID,
  customerID,
  merchantID,
  status: ORDER_STATUS.WAITING,
});

const listOrderOnline = [];

export const getOrder = (id) => {
  const indexOf = listOrderOnline.map((order) => order.id).indexOf(id);
  if (indexOf < 0) return null;

  return listOrderOnline[indexOf];
};

export const addOrder = (orderID, customerID, merchantID, shipperID) => {
  listOrderOnline.push(newOrder(orderID, customerID, merchantID, shipperID));
};

export const removeorder = (id) => {
  const newListOrderOnline = listOrderOnline.filter((order) =>
    order.id !== id ? order : null
  );

  listOrderOnline = newListOrderOnline;
};
