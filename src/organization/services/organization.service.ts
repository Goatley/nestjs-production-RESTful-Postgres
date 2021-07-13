import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { OrganizationEvents } from '../events/organization.events';
import { IUserToken } from 'src/user/interfaces/user.interface';
import { InsufficientPermissionError } from '../../errors/errors';
import { OrganizationPermissions } from '../permissions/organization.permissions';
import { Action } from '../../permissions/actions';
import {
	IOrganization,
	IOrganizationUser,
	IOrganizationEvent,
} from '../interfaces/organization.interface';
import { InjectedConstants } from '../../config/constants.config';
import { OrganizationListDto } from '../dto/organization-list.dto';
import { OrganizationRepo } from '../repository/organization.repo';
import { OrganizationUserControlRepo } from '../repository/organization-user-control.repo';

@Injectable()
export class OrganizationService {
	constructor(
		@Inject(InjectedConstants.organization_repo)
		private orgRepo: OrganizationRepo,
		@Inject(InjectedConstants.organization_user_control_repo)
		private orgUserRepo: OrganizationUserControlRepo,
		private eventEmitter: EventEmitter2,
		private organizationPermissions: OrganizationPermissions,
		private readonly logger: Logger,
	) {}

	/**
	 *
	 * @param createOrganizationDto
	 * @param user
	 * @Event organizationCreatedEvent
	 * @returns Returns a created organization based on input.  Will create the organization in addition to updating the user model to contain the org.  Releases the organization created event
	 */
	async create(createOrganizationDto: CreateOrganizationDto, user: IUserToken) {
		//first, let's create our access object to mimic the prepared object for Mongo

		//create the new organization
		let organization: IOrganization;
		try {
			organization = await this.orgRepo.createOne(
				createOrganizationDto.name,
				createOrganizationDto.description,
				user.user_id,
			);
		} catch {}

		//let's send out our event for any listeners to catch
		const orgCreatedEvt: IOrganizationEvent = {
			org_id: organization.org_id,
			user_id: user.user_id,
		};

		//log our created org
		this.logger.log(
			`User ${user.user_id} created organization ${organization.org_id}`,
		);

		this.eventEmitter.emit(OrganizationEvents.created, orgCreatedEvt);

		return organization;
	}

	/**
	 *
	 * @param user
	 * @returns finds all organizations that the user requesting belongs to.
	 */
	async findAll(user: IUserToken): Promise<OrganizationListDto> {
		//lets grab organizations that belong to this user
		let organizations: Array<IOrganization>;
		try {
			organizations = await this.orgRepo.retrieveOrgsByUser(user.user_id);
		} catch (err) {}

		return { organizations: organizations };
	}

	/**
	 *
	 * @param organizationId
	 * @param user
	 * @Permission - requires user to be listed as either an admin or a user of the organization
	 * @returns the organization that was requested based on the organization ID passed in as a param
	 */
	async findOne(
		organizationId: string,
		user: IUserToken,
	): Promise<IOrganization> {
		//first, let's see if our user is a valid user of the organization

		let orgUser: IOrganizationUser;
		let organization: IOrganization;
		try {
			orgUser = await this.orgUserRepo.retrieveOne(+organizationId, user.user_id);
		} catch (err) {}

		if (!this.organizationPermissions.checkPermission(Action.Read, orgUser)) {
			throw new InsufficientPermissionError(
				'Error - insufficient permissions to access this organization.',
			);
		}

		try {
			this.orgRepo.retrieveOneById(+organizationId);
		} catch (err) {}

		return organization;
	}

	/**
	 *
	 * @param organizationId
	 * @param updateOrganizationDto
	 * @param user
	 * @event organization updated event
	 * @permission Requires admin permission; being listed as an admin of the org
	 * @returns returns the updated organization
	 */
	async update(
		organizationId: string,
		updateOrganizationDto: UpdateOrganizationDto,
		user: IUserToken,
	) {
		//let's see if the user has permission to update this org; will need to be an admin
		let orgUser: IOrganizationUser;

		try {
			orgUser = await this.orgUserRepo.retrieveOne(+organizationId, user.user_id);
		} catch (err) {}

		//check permissions
		if (!this.organizationPermissions.checkPermission(Action.Update, orgUser)) {
			throw new InsufficientPermissionError();
		}

		//update the org now
		let organization: IOrganization;
		try {
			this.orgRepo.updateOne(updateOrganizationDto, orgUser.org_id);
		} catch (err) {}

		//emit our updated Org event event
		const organizationUpdatedEvent: IOrganizationEvent = {
			org_id: organization.org_id,
			user_id: user.user_id,
		};

		this.eventEmitter.emit(OrganizationEvents.updated, organizationUpdatedEvent);

		//log the updated org/action
		this.logger.log(
			`Organization updated: user ${user.user_id} updated organization ${organization.org_id}`,
		);

		return organization;
	}

	/**
	 *
	 * @param organizationId
	 * @param user instance of UserToken
	 * @event organizationDeletedEvent
	 * @permission admin - requires being an admin of this organization
	 * @returns organization - the organization which was deleted
	 */
	// async remove(organizationId: string, user: IUserToken) {
	// 	//first let's retrieve the specific org
	// 	//keep as a document to modifylater
	// 	const organization = await this.organizationModel
	// 		.findById(organizationId)
	// 		.lean()
	// 		.orFail();

	// 	//let's check to make sure the user is an admin of the org first
	// 	if (
	// 		!this.organizationPermissions.checkPermission(
	// 			Action.Delete,
	// 			organization,
	// 			user,
	// 		)
	// 	) {
	// 		throw new InsufficientPermissionError();
	// 	}

	// 	//now let's do business logic checking - we don't want to delete any orgs that still have projects associated with them
	// 	if (organization.projects.length > 0) {
	// 		throw new ActionNotAllowedError(
	// 			'Error - Unable to delete an organization that still has active projects',
	// 		);
	// 	}

	// 	//let's delete the doc
	// 	await this.organizationModel.deleteOne({ _id: organization._id }).orFail();

	// 	//let's emit our event to delete the org
	// 	const organizationDeletedEvent: IOrganizationEvent = {
	// 		organization: organization,
	// 		user: user,
	// 	};

	// 	this.eventEmitter.emit(OrganizationEvents.deleted, organizationDeletedEvent);

	// 	//log our deleted or
	// 	this.logger.log(
	// 		`Organization Deleted: user ${user._id} deleted organization ${organization._id}.`,
	// 	);

	// 	return organization;
	// }
}
