const MERCHANT_DEFAULT = {
  id: null,
  socket: null,
};

let listMetchantOnline = [];

export const getMerchant = (id) => {
  // @ts-expect-error
  const indexOf = listMetchantOnline.map((merchant) => merchant.id).indexOf(id);
  if (indexOf < 0) return null;

  return listMetchantOnline[indexOf];
};

export const addMerchant = (id, socket) => {
  // @ts-expect-error
  listMetchantOnline.push({ id, socket });
};

export const removeMerchant = (id) => {
  const newListMetchantOnline = listMetchantOnline.filter((merchant) => {
    // @ts-expect-error
    return merchant.id !== id ? merchant : null;
  });

  listMetchantOnline = newListMetchantOnline;
};

export const pushOrder = (merchantID, order) => {};
