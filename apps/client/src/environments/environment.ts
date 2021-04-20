import { environment as base } from './base';

export const environment = {
  production: false,
  ...base,
  MONGO_DB: 'mongodb://localhost:27017/nowDB',
};
