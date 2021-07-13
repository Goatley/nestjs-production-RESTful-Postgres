import { InjectedConstants } from '../config/constants.config';
import { OrganizationRepo } from './repository/organization.repo';
import { OrganizationUserControlRepo } from './repository/organization-user-control.repo';

export const OrganizationProviders = [
	{
		provide: InjectedConstants.organization_repo,
		useClass: OrganizationRepo,
	},
	{
		provide: InjectedConstants.organization_user_control_repo,
		useClass: OrganizationUserControlRepo,
	},
];
