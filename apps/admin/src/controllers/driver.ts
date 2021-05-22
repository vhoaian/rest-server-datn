import { nomalizeResponse } from "../utils/normalize";

export async function getDriverManagement(req, res) {
  const { email, phone, page } = req.query;

  res.send(nomalizeResponse(null, 0));
}
