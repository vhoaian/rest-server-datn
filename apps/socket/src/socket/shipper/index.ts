const SHIPPER_DEFAULT = {
  id: null,
  socket: null,
};

let listShipperOnline = [];

export const getShipper = (id) => {
  // @ts-expect-error
  const indexOf = listShipperOnline.map((shipper) => shipper.id).indexOf(id);
  if (indexOf < 0) return null;

  return listShipperOnline[indexOf];
};

export const addShipper = (id, socket) => {
  // @ts-expect-error
  listShipperOnline.push({ id, socket });
};

export const removeShipper = (id) => {
  const newListShipperOnline = listShipperOnline.filter((shipper) => {
    // @ts-expect-error
    return shipper.id !== id ? shipper : null;
  });

  listShipperOnline = newListShipperOnline;
};
