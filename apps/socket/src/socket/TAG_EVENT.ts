export const TAG_LOG = "SOCKET";
export const TAG_LOG_ERROR = "SOCKET_ERROR";
export const TAG_EVENT = {
  // For all [Customer, Merchant, Shipper]
  REQUEST_JOIN_ROOM: "REQUEST_JOIN_ROOM",
  RESPONSE_JOIN_ROOM: "RESPONSE_JOIN_ROOM",

  REQUEST_LEAVE_ROOM: "REQUEST_LEAVE_ROOM",
  RESPONSE_LEAVE_ROOM: "RESPONSE_LEAVE_ROOM",

  REQUEST_CHANGE_STATUS_ROOM: "REQUEST_CHANGE_STATUS_ROOM",
  RESPONSE_CHANGE_STATUS_ROOM: "RESPONSE_CHANGE_STATUS_ROOM",

  REQUEST_DISCONNECT_ROOM: "REQUEST_DISCONNECT_ROOM",
  RESPONSE_DISCONNECT_ROOM: "RESPONSE_DISCONNECT_ROOM",

  REQUEST_NOTIFICATION: "REQUEST_NOTIFICATION",
  RESPONSE_NOTIFICATION: "RESPONSE_NOTIFICATION",

  // Shipper
  REQUEST_SHIPPER_RECONNECT: "REQUEST_SHIPPER_RECONNECT",
  RESPONSE_SHIPPER_RECONNECT: "RESPONSE_SHIPPER_RECONNECT",

  REQUEST_SHIPPER_CHANGE_COOR: "REQUEST_SHIPPER_CHANGE_COOR",
  RESPONSE_SHIPPER_CHANGE_COOR: "RESPONSE_SHIPPER_CHANGE_COOR",

  REQUEST_SHIPPER_CONFIRM_ORDER: "REQUEST_SHIPPER_CONFIRM_ORDER",
  RESPONSE_SHIPPER_CONFIRM_ORDER: "RESPONSE_SHIPPER_CONFIRM_ORDER",
  RESPONSE_SHIPPER_SKIP_CONFIRM_ORDER: "RESPONSE_SHIPPER_SKIP_CONFIRM_ORDER",
  RESPONSE_SHIPPER_CONFIRM_ORDER_FAILED:
    "RESPONSE_SHIPPER_CONFIRM_ORDER_FAILED",

  REQUEST_SHIPPER_CANCEL_ORDER: "REQUEST_SHIPPER_CANCEL_ORDER",
  RESPONSE_SHIPPER_CANCEL_ORDER: "RESPONSE_SHIPPER_CANCEL_ORDER",

  REQUEST_SHIPPER_SKIP_ORDER: "REQUEST_SHIPPER_SKIP_ORDER",
  RESPONSE_SHIPPER_SKIP_ORDER: "RESPONSE_SHIPPER_SKIP_ORDER",

  REQUEST_SHIPPER_ARRIVED: "REQUEST_SHIPPER_ARRIVED",
  RESPONSE_SHIPPER_ARRIVED: "RESPONSE_SHIPPER_ARRIVED",

  REQUEST_SHIPPER_TOOK_FOOD: "REQUEST_SHIPPER_TOOK_FOOD",
  RESPONSE_SHIPPER_TOOK_FOOD: "RESPONSE_SHIPPER_TOOK_FOOD",

  REQUEST_SHIPPER_DELIVERED: "REQUEST_SHIPPER_DELIVERED",
  RESPONSE_SHIPPER_DELIVERED: "RESPONSE_SHIPPER_DELIVERED",

  // Merchant
  REQUEST_MERCHANT_RECONNECT: "REQUEST_MERCHANT_RECONNECT",
  RESPONSE_MERCHANT_RECONNECT: "RESPONSE_MERCHANT_RECONNECT",

  REQUEST_MERCHANT_CONFIRM_ORDER: "REQUEST_MERCHANT_CONFIRM_ORDER",
  RESPONSE_MERCHANT_CONFIRM_ORDER: "RESPONSE_MERCHANT_CONFIRM_ORDER",

  REQUEST_MERCHANT_CANCEL_ORDER: "REQUEST_MERCHANT_CANCEL_ORDER",
  RESPONSE_MERCHANT_CANCEL_ORDER: "RESPONSE_MERCHANT_CANCEL_ORDER",

  // Customer
  REQUEST_CUSTOMER_RECONNECT: "REQUEST_CUSTOMER_RECONNECT",
  RESPONSE_CUSTOMER_RECONNECT: "RESPONSE_CUSTOMER_RECONNECT",

  REQUEST_CUSTOMER_CANCEL_ORDER: "REQUEST_CUSTOMER_CANCEL_ORDER",
  RESPONSE_CUSTOMER_CANCEL_ORDER: "RESPONSE_CUSTOMER_CANCEL_ORDER",

  REQUEST_CUSTOMER_PAYMENT_ORDER: "REQUEST_CUSTOMER_PAYMENT_ORDER",
  RESPONSE_CUSTOMER_PAYMENT_ORDER: "RESPONSE_CUSTOMER_PAYMENT_ORDER",
};
