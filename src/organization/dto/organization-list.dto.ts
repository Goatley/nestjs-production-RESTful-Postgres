import { ApiProperty } from '@nestjs/swagger';
import { IOrganization } from '../interfaces/organization.interface';

export class OrganizationListDto {
	@ApiProperty({
		description: 'A list of organizations',
		isArray: true,
	})
	organizations: Array<IOrganization>;
}
