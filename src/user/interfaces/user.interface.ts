export interface IUser {
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface IPartialUser {
  user_id: number;
  username?: string;
  email: string;
}

export interface IUserToken {
  user_id: number;
  email: string;
}
