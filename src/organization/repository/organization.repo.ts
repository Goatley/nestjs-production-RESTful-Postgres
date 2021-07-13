import { Injectable, Inject } from '@nestjs/common';
import { InjectedConstants } from '../../config/constants.config';
import { Pool } from 'pg';
import { IOrganization } from '../interfaces/organization.interface';
import { OrganizationUserControlRepo } from './organization-user-control.repo';
import { IPreparedQuery } from '../../database/interfaces/database.interface';
import { buildUpdateQuery } from '../../util/updateQueryBuilder.util';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';

@Injectable()
export class OrganizationRepo {
	constructor(
		@Inject(InjectedConstants.database_connection) private pool: Pool,
		@Inject(InjectedConstants.organization_user_control_repo)
		private orgUserControlRepo: OrganizationUserControlRepo,
	) {}

	public async retrieveOneById(org_id: number): Promise<IOrganization> {
		const orgQuery = {
			name: 'fetch-org',
			text: 'Select org_id, name, description from organization where org_id = $1',
			values: [org_id],
		};

		return (await this.pool.query<IOrganization>(orgQuery)).rows[0];
	}

	// public async retrieveMany() {}

	public async retrieveOrgsByUser(user_id): Promise<Array<IOrganization>> {
		const getOrgsQuery: IPreparedQuery = {
			name: 'retrieve-orgs-for-user',
			text:
				'select org.org_id, org.name, org.description from organization org left join organization_user_control ouc on org.org_id = ouc.org_id WHERE ouc.user_id = $1',
			values: [user_id],
		};

		return (await this.pool.query<IOrganization>(getOrgsQuery)).rows;
	}

	public async createOne(
		orgName: string,
		orgDescription: string,
		user_id: number,
	) {
		//create the prepared query
		const createOrgQuery: IPreparedQuery = {
			name: 'create-organization',
			text:
				'insert into organization(name, description, created_by, updated_by) values ($1, $2, $3, $3) returning *',
			values: [orgName, orgDescription, user_id],
		};

		const organization = (await this.pool.query<IOrganization>(createOrgQuery))
			.rows[0];

		//create the org user as an admin of the org
		await this.orgUserControlRepo.createOne(organization.org_id, user_id, true);

		return organization;
	}

	// public async replaceOne() {}

	public async updateOne(
		updateOrganizationDto: UpdateOrganizationDto,
		org_id: number,
	): Promise<IOrganization> {
		//let's build our update query first:
		const updateQuery = buildUpdateQuery(
			'organization',
			updateOrganizationDto,
			`org_id = ${org_id}`,
		);

		return (await this.pool.query<IOrganization>(updateQuery)).rows[0];
	}

	// public async deleteOne() {}
}
