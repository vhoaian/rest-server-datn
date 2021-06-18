import { sign } from "jsonwebtoken";
import { environment } from "../environments/environment";

export function getToken(id) {
  const payload = {
    id: id,
    role: "shipper",
  };
  // create token JWT
  const token = sign(payload, environment.JWT.secretKey, {
    expiresIn: "7d",
  });
  return token;
}
