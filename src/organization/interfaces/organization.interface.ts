export interface IOrganization {
	org_id: number;
	name: string;
	description?: string;
}

export interface IOrganizationUser {
	org_user_id: number;
	org_id: number;
	user_id: number;
	is_admin: boolean;
	is_active: boolean;
}

//event payload when an org is created/modified
export interface IOrganizationEvent {
	org_id: number;
	user_id: number;
}

//payload for when organization user management happens
export interface IOrganizationUserAddedEvent extends IOrganizationEvent {
	added_user_id: number;
}

export interface IOrganizationUserDeletedEvent extends IOrganizationEvent {
	deleted_user_id: number;
}

export interface IOrganizationUserCreatedEvent extends IOrganizationEvent {
	created_user_id: number;
}

//payload for when organization admin management happens
export interface IOrganizationAdminUpdatedEvent extends IOrganizationEvent {
	updated_admin_id: number;
}

export interface IOrganizationAdminDeletedEvent extends IOrganizationEvent {
	deleted_admin_id: number;
}
