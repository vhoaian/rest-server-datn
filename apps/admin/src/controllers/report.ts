import { nomalizeResponse } from "../utils/normalize";

export async function getReportList(req, res) {
  const { page } = req.query;

  res.send(nomalizeResponse(null, 0));
}
