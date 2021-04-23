const MERCHANT_DEFAULT = {
  id: null,
  socket: null,
};

const listMetchantOnline = [];

export const getMerchant = (id) => {
  const indexOf = listMetchantOnline.map((merchant) => merchant.id).indexOf(id);
  if (indexOf < 0) return null;

  return listMetchantOnline[indexOf];
};

export const addMerchant = (id, socket) => {
  listMetchantOnline.push({ id, socket });
};

export const removeMerchant = (id) => {
  const newListMetchantOnline = listMetchantOnline.filter((merchant) =>
    merchant.id !== id ? merchant : null
  );

  listMetchantOnline = newListMetchantOnline;
};

export const pushOrder = (merchantID, order) => {};
