import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { IUserToken } from '../user/interfaces/user.interface';
import { InjectedConstants } from '../config/constants.config';
import { Pool } from 'pg';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		@Inject(InjectedConstants.database_connection) private pool: Pool,
	) {
		super({
			secretOrKeyProvider: passportJwtSecret({
				cache: true,
				rateLimit: true,
				jwksRequestsPerMinute: 5,
				jwksUri: `${process.env.AUTH0_ISSUER_URL}.well-known/jwks.json`,
			}),

			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			audience: process.env.AUTH0_AUDIENCE,
			issuer: `${process.env.AUTH0_ISSUER_URL}`,
			algorithms: ['RS256'],
		});
	}

	async validate(payload: unknown): Promise<IUserToken> {
		let userResult;
		try {
			userResult = (
				await this.pool.query('select * from users where email like $1', [
					payload['https://goatit.tech/email'],
				])
			).rows[0];
		} catch (err) {}

		const user: IUserToken = {
			user_id: userResult.user_id,
			email: payload['https://goatit.tech/email'],
		};

		return user;
	}
}
