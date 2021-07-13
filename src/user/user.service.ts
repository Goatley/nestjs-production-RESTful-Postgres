import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { IUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectedConstants } from '../config/constants.config';

@Injectable()
export class UserService {
	constructor(
		@Inject(InjectedConstants.database_connection) private pool: Pool,
	) {}

	async create(createUserDto: CreateUserDto): Promise<IUser> {
		//first create our data access object
		//convert auth0 unique ID to mongoDB objectId type
		const createUserQuery =
			'insert into users(first_name, last_name, email) values ($1, $2, $3) returning *';
		const values = [
			createUserDto.first_name,
			createUserDto.last_name,
			createUserDto.email,
		];

		const result = await this.pool.query<IUser>(createUserQuery, values);

		return result.rows[0];
	}

	findAll() {
		return `This action returns all user`;
	}

	findOne(id: string) {
		return `looking for user ${id}`;
	}

	update(user_id: number, updateUserDto: UpdateUserDto) {
		return `This action updates a #${user_id} user`;
	}

	remove(id: number) {
		return `This action removes a #${id} user`;
	}
}
