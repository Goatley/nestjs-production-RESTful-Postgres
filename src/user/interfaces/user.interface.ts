export interface IUser {
	user_id: number;
	first_name?: string;
	last_name?: string;
	email?: string;
}

export interface IUserToken {
	user_id: number;
	email: string;
}
