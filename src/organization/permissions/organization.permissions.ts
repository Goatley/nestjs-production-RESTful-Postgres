import { Injectable } from '@nestjs/common';
import { Action } from '../../permissions/actions';
import { IOrganizationUser } from '../interfaces/organization.interface';

@Injectable()
export class OrganizationPermissions {
	checkPermission(action: Action, orgUser: IOrganizationUser) {
		//first see if they're even a user of this org
		//or if the org/user combo is valid
		if (!orgUser) return false;

		//Admins have total control for all actions
		if (orgUser.is_admin) return true;

		switch (action) {
			//users can read if they're listed as a user of that org
			case Action.Read:
				return true;
				break;
			//Anyone can create a new org
			//todo may change based on email verification or org limits
			case Action.Create:
				return true;
				break;
			//Users can't update an org - only admins
			case Action.Update:
				return false;
				break;
			case Action.Delete:
				return false;
				break;
			case Action.Manage:
				return false;
				break;
		}
	}
}
