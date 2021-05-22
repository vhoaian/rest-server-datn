import { nomalizeResponse } from "../utils/normalize";

export async function getGeneralStatistics(req, res) {
  res.send(nomalizeResponse(null, 0));
}
