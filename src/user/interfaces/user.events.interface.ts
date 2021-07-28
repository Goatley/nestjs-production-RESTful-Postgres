export interface IUserEvent {
  userId: number;
}

export interface IUserUpdatedEvent extends IUserEvent {
  firstName?: string;
  lastName?: string;
  userName?: string;
}

export interface IUserEmailUpdated extends IUserEvent {
  email: string;
}
