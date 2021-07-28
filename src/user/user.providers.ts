import { InjectedConstants } from '../config/constants.config';
import { UserRepo } from './repositories/user.repo';

export const UserProviders = [
  {
    provide: InjectedConstants.user_repo,
    useClass: UserRepo,
  },
];
