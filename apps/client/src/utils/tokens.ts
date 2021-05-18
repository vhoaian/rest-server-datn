import { sign } from 'jsonwebtoken';
import { environment } from '../environments/environment';

export function getToken(id) {
  const payload = {
    id: id,
  };
  // create token JWT
  const token = sign(payload, environment.JWT.secretKey, {
    expiresIn: '4h',
  });
  return token;
}
