export default interface SHIPPER {
  id: string | null;
  socketID: string | null;
  coor: { lat: number; lng: number };
  listOrderID: Array<string>;
  beingRequested: boolean;
  maximumOrder: number;
  maximumDistance: number; // unit: km
  maximumAmount: number; // unit VND
  rating: number;
  historyOrder: {
    skip: number;
    cancel: number;
    delivered: number;
  };
  selfDestruct: any;
}
