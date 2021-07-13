import { Injectable, Inject } from '@nestjs/common';
import { InjectedConstants } from '../../config/constants.config';
import { Pool } from 'pg';
import { IOrganizationUser } from '../interfaces/organization.interface';
import { IPreparedQuery } from 'src/database/interfaces/database.interface';

@Injectable()
export class OrganizationUserControlRepo {
	constructor(
		@Inject(InjectedConstants.database_connection) private pool: Pool,
	) {}

	public async retrieveOne(
		org_id: number,
		user_id: number,
	): Promise<IOrganizationUser> {
		const orgUserQuery: IPreparedQuery = {
			name: 'fetch-org-user',
			text:
				'Select * from organization_user_control where org_id = $1 and user_id = $2',
			values: [org_id, user_id],
		};

		return (await this.pool.query<IOrganizationUser>(orgUserQuery)).rows[0];
	}

	// public async retrieveMany() {}

	public async createOne(
		org_id: number,
		user_id: number,
		is_admin: boolean,
	): Promise<IOrganizationUser> {
		const createOrgUserQuery = {
			name: 'create-organization-users',
			text:
				'insert into organization_user_control (org_id, user_id, is_admin, created_by, updated_by) values ($1, $2, $3, $2, $2) returning *',
			values: [org_id, user_id, is_admin],
		};

		return (await this.pool.query<IOrganizationUser>(createOrgUserQuery)).rows[0];
	}

	// public async replaceOne() {}

	// public async updateOne() {}

	// public async deleteOne() {}
}
