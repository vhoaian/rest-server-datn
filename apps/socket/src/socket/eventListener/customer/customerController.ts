import config from "../../../config";

const isLog = config.LOG_SOCKET.indexOf("customer") > -1 ? true : false;

const CUSTOMER_DEFAULT = {
  id: null,
  socketID: null,
};

let listCustomerOnline: any = [];

// Log list customer online
if (isLog)
  setInterval(() => {
    console.log("LIST CUSTOMER ONLINE");
    console.table(listCustomerOnline);
  }, 5000);

export const getCustomer = (id) => {
  const indexOf = listCustomerOnline.map((customer) => customer.id).indexOf(id);
  if (indexOf < 0) return null;

  return listCustomerOnline[indexOf];
};

export const addCustomer = (id, socketID) => {
  listCustomerOnline.push({ id, socketID });
};

export const removeCustomer = (id) => {
  const newListCustomerOnline = listCustomerOnline.filter((customer) => {
    return customer.id !== id ? customer : null;
  });

  listCustomerOnline = newListCustomerOnline;
};
