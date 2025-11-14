import { User } from './user';

export interface ISession {
  user: User;
  tenantId?: string;
}
