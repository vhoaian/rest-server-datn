interface COOR {
  lat: number;
  lng: number;
}

export const calcDistance = (p1: COOR, p2: COOR) => {
  const R = 3958.8; // Radius of the Earth in miles
  const rlat1 = p1.lat * (Math.PI / 180); // Convert degrees to radians
  const rlat2 = p2.lat * (Math.PI / 180); // Convert degrees to radians
  const difflat = rlat2 - rlat1; // Radian difference (latitudes)
  const difflon = (p2.lng - p1.lng) * (Math.PI / 180); // Radian difference (longitudes)

  const d =
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
          Math.cos(rlat1) *
            Math.cos(rlat2) *
            Math.sin(difflon / 2) *
            Math.sin(difflon / 2)
      )
    );
  return d.toFixed(1);
};
