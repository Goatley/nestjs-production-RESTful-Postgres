import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Pool } from 'pg';
import { OrganizationEvents } from '../events/organization.events';
import { IUser, IUserToken } from '../../user/interfaces/user.interface';
import {
	InsufficientPermissionError,
	ActionNotAllowedError,
} from '../../errors/errors';
import { OrganizationPermissions } from '../permissions/organization.permissions';
import { Action } from '../../permissions/actions';
import {
	IOrganization,
	IOrganizationUser,
	IOrganizationUserAddedEvent,
	IOrganizationUserCreatedEvent,
	IOrganizationUserDeletedEvent,
} from '../interfaces/organization.interface';
import { InjectedConstants } from '../../config/constants.config';
import { UserListDto } from '../dto/user-list.dto';
import { CreateOrganizationUserDto } from '../dto/create-organization-user.dto';

/**
 * Service class for Organization User management
 *
 */

@Injectable()
export class OrganizationUserService {
	constructor(
		@Inject(InjectedConstants.database_connection)
		private pool: Pool,
		private eventEmitter: EventEmitter2,
		private organizationPermissions: OrganizationPermissions,
		private readonly logger: Logger,
	) {}

	/**
	 *
	 * @param organizationId - Org Id passed to path
	 * @param user - IUserToken
	 * @permission - requires that the user supplied by the token be either an admin or a user of the organization
	 * @returns Finds all users that belong to an organization and returns them.  Will return an object containing the admins array and the users array
	 */
	async findAll(organizationId: string, user: IUserToken): Promise<UserListDto> {
		//permission check first
		let orgUser: IOrganizationUser;
		try {
			const orgUserQuery = {
				name: 'fetch-org-user',
				text: 'select * from organization_user_control where org_id = $1',
				values: [organizationId],
			};

			orgUser = (await this.pool.query<IOrganizationUser>(orgUserQuery)).rows[0];
		} catch (err) {}

		//now, let's verify if the user has permission to view.  Either an admin or user of the org needs READ
		if (!this.organizationPermissions.checkPermission(Action.Read, orgUser)) {
			throw new InsufficientPermissionError();
		}

		//let's grab the org and their users now
		let fetchedUsers: Array<IUser>;
		try {
			const fetchUsersQuery = {
				name: 'fetch-users-in-org',
				text:
					'select users.user_id, users.email, users.first_name, users.last_name from users left join organization_user_control ouc on users.user_id = ouc.user_id where ouc.org_id = $1 and ouc.is_admin = false and ouc.is_active = true',
				values: [organizationId],
			};

			fetchedUsers = (await this.pool.query<IUser>(fetchUsersQuery)).rows;
		} catch (err) {}

		//let's return the users of the org
		return {
			org_id: orgUser.org_id,
			users: fetchedUsers,
		};
	}

	async create(
		organizationId: string,
		createOrganizationUserDto: CreateOrganizationUserDto,
		user: IUserToken,
	): Promise<IUser> {
		//first, let's do a permissions check
		let orgUser: IOrganizationUser;
		try {
			const orgUserQuery = {
				name: 'fetch-org-user',
				text: 'select * from organization_user_control where org_id = $1',
				values: [organizationId],
			};

			orgUser = (await this.pool.query<IOrganizationUser>(orgUserQuery)).rows[0];
		} catch (err) {}

		if (!this.organizationPermissions.checkPermission(Action.Manage, orgUser)) {
			throw new InsufficientPermissionError(
				'You have insufficient permissions to add users to this organization.  You must be an admin.',
			);
		}

		//first, let's see if we have a user already registered to that email
		let newUser: IUser;
		try {
			const checkUser = (
				await this.pool.query('select * from users where email like $1', [
					createOrganizationUserDto.userEmail,
				])
			).rows[0];

			//if the user exists, let's set them to newUser and add them to org_user_control
			if (checkUser) {
				newUser = checkUser;

				//first, let's make sure they aren't already a user
				const existingOrgUser = (
					await this.pool.query<IOrganizationUser>(
						'Select * from organization_user_control where org_id = $1 and org_user = $2',
						[orgUser.org_id, newUser.user_id],
					)
				).rows[0];

				//reject if they're already a user and are activated
				if (existingOrgUser && existingOrgUser.is_active == true) {
					throw new ActionNotAllowedError(
						'Unable to add this user as they are already a part of this organization.',
					);
				} else if (existingOrgUser && existingOrgUser.is_active == false) {
					//let's reactivate them then if htey are de-activated
					await this.pool.query(
						'Update organization_user_control set is_active = true where org_id = $1 and user_id = $2',
						[orgUser.org_id, existingOrgUser.user_id],
					);

					//send the event and return
					const orgUserAddedEvent: IOrganizationUserAddedEvent = {
						org_id: orgUser.user_id,
						user_id: user.user_id,
						added_user_id: existingOrgUser.user_id,
					};

					this.eventEmitter.emit(OrganizationEvents.userAdded, orgUserAddedEvent);

					this.logger.log(
						`Existing user ${existingOrgUser.user_id} added to organization ${orgUser.org_id}`,
					);

					return existingOrgUser;
				}

				//let's add them to this org
				await this.pool.query(
					'insert into organization_user_control (org_id, user_id) values ($1, $2)',
					[orgUser.org_id, newUser.user_id],
				);

				//send the event and return
				const orgUserAddedEvent: IOrganizationUserAddedEvent = {
					org_id: orgUser.user_id,
					user_id: user.user_id,
					added_user_id: newUser.user_id,
				};

				this.eventEmitter.emit(OrganizationEvents.userAdded, orgUserAddedEvent);

				this.logger.log(
					`Existing user ${newUser.user_id} added to organization ${orgUser.org_id}`,
				);

				return newUser;
			} else {
				//let's create the new user otherwise
				//only email for now; will get other infor when they sign up
				newUser = (
					await this.pool.query<IUser>(
						'insert into users (email) values ($1) returning *',
						[createOrganizationUserDto.userEmail],
					)
				).rows[0];

				//now let's add them to the org
				await this.pool.query(
					'insert into organization_user_control(org_id, user_id) values ($1, $2)',
					[orgUser.org_id, newUser.user_id],
				);

				//create and send the event
				const orgUserCreatedEvent: IOrganizationUserCreatedEvent = {
					org_id: orgUser.org_id,
					user_id: user.user_id,
					created_user_id: newUser.user_id,
				};

				this.eventEmitter.emit(OrganizationEvents.userCreated, orgUserCreatedEvent);

				this.logger.log(
					`New user ${newUser.user_id} was created and added to organization ${orgUser.org_id}`,
				);

				return newUser;
			}
		} catch (err) {}
	}
}

/**
 * deletes a single user based on user and organization passed into the route param
 *
 * @param organizationId
 * @param userIdToDelete
 * @param user
 * @event emits the organizationUserDeleted event
 * @permission Requires that the user requesting the action be an admin for the organization
 * @returns Returns the updated list of users for an organization post-delete
 */
// async remove(
// 	organizationId: string,
// 	userIdToDelete: string,
// 	user: IUserToken,
// ): Promise<UserListDto> {
// 	//first, let's grab our organization
// 	//keeping as a document for now
// 	const organization = await this.organizationModel
// 		.findById(organizationId)
// 		.orFail();

// 	//lets also make sure we can actually retrieve our user or throw an error if not
// 	await this.userModel.findOne({ _id: userIdToDelete }).orFail();

// 	//let's see if we have permission to remove the users (aka is an admin)
// 	if (
// 		!this.organizationPermissions.checkPermission(
// 			Action.Delete,
// 			organization,
// 			user,
// 		)
// 	) {
// 		throw new InsufficientPermissionError();
// 	}

// 	//check to see if the user is an admin - we don't want to be able to remove the user from 'users' if they are an 'admin'.  They must remove them as an admin first, then as a user
// 	//we don't ever have to worry about removing the last user, as that would be yourself, and you can't remove the last admin which would need to happen first
// 	if (organization.admins.includes(Types.ObjectId(userIdToDelete))) {
// 		throw new ActionNotAllowedError(
// 			'You cannot remove a user that is also an admin of an organization.  Please remove them as an admin first.',
// 		);
// 	}

// 	//lets run update query to remove the users or admin from the org
// 	const updatedOrg = (await this.organizationModel
// 		.findOneAndUpdate(
// 			{ _id: organization._id },
// 			{
// 				updatedBy: user._id,
// 				$pull: {
// 					users: Types.ObjectId(userIdToDelete),
// 				},
// 			},
// 			{ new: true },
// 		)
// 		.populate('users', '_id email')
// 		.lean()
// 		.orFail()) as Populated<IOrganizationDocument, 'users'>;

// 	//now we need to remove the org from each of the users removed
// 	const deletedUser = await this.userModel
// 		.findByIdAndUpdate(userIdToDelete, {
// 			$pull: {
// 				organizations: updatedOrg._id,
// 			},
// 		})
// 		.lean()
// 		.orFail();

// 	//now let's emit our event to notify users/admins were removed
// 	const orgUserDeletedEvt: IOrganizationUserDeletedEvent = {
// 		organization: updatedOrg,
// 		user: user,
// 		deletedUser: deletedUser,
// 	};

// 	this.eventEmitter.emit(OrganizationEvents.userDeleted, orgUserDeletedEvt);

// 	//FINALLY let's return the updated org
// 	return {
// 		_id: updatedOrg._id,
// 		users: updatedOrg.users,
// 	};
// }
// }
