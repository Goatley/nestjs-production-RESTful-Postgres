import { ApiProperty } from '@nestjs/swagger';
import { IUser } from '../../user/interfaces/user.interface';

export class UserListDto {
	@ApiProperty({
		description: 'The unique ID of the organization.',
	})
	org_id: number;

	@ApiProperty({
		description: 'An array of users that belong to the organization',
		isArray: true,
	})
	users: Array<IUser>;
}
