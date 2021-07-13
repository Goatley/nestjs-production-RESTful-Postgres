import { Pool } from 'pg';
import { InjectedConstants } from '../config/constants.config';

export const databaseProviders = [
	{
		provide: InjectedConstants.database_connection,
		useFactory: (): Pool => {
			return new Pool();
		},
	},
];
