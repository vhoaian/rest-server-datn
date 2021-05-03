import config from "../../config";

const isLog = config.LOG_SOCKET.indexOf("merchant") > -1 ? true : false;

const MERCHANT_DEFAULT = {
  id: null,
  socketID: null,
};

let listMetchantOnline = [];

// Log list customer online
if (isLog)
  setInterval(() => {
    console.log("LIST MERCHANT ONLINE");
    console.table(listMetchantOnline);
  }, 5000);

export const getMerchant = (id) => {
  // @ts-expect-error
  const indexOf = listMetchantOnline.map((merchant) => merchant.id).indexOf(id);
  if (indexOf < 0) return null;

  return listMetchantOnline[indexOf];
};

export const addMerchant = (id, socketID) => {
  // @ts-expect-error
  listMetchantOnline.push({ id, socketID });
};

export const removeMerchant = (id) => {
  const newListMetchantOnline = listMetchantOnline.filter((merchant) => {
    // @ts-expect-error
    return merchant.id !== id ? merchant : null;
  });

  listMetchantOnline = newListMetchantOnline;
};

export const pushOrder = (merchantID, order) => {};
