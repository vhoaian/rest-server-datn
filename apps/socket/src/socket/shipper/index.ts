const SHIPPER_DEFAULT = {
  id: null,
  socket: null,
};

const listShipperOnline = [];

export const getShipper = (id) => {
  const indexOf = listShipperOnline.map((shipper) => shipper.id).indexOf(id);
  if (indexOf < 0) return null;

  return listShipperOnline[indexOf];
};

export const addShipper = (id, socket) => {
  listShipperOnline.push({ id, socket });
};

export const removeShipper = (id) => {
  const newListShipperOnline = listShipperOnline.filter((shipper) =>
    shipper.id !== id ? shipper : null
  );

  listShipperOnline = newListShipperOnline;
};
