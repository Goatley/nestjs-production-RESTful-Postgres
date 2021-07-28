import { Injectable, Inject } from '@nestjs/common';
import { InjectedConstants } from '../../config/constants.config';
import { Pool } from 'pg';
import { IPreparedQuery } from '../../database/interfaces/database.interface';
import { ResourceNotFoundError } from '../../errors/errors';
import { IPartialUser, IUser } from '../interfaces/user.interface';
import { buildUpdateQuery } from 'src/util/updateQueryBuilder.util';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateNotificationDto } from '../dto/update-notifications.dto';
import { IUserNotificationSettings } from '../interfaces/user-notifications.interface';
import { UpdateEmailDto } from '../dto/update-email.dto';

@Injectable()
export class UserRepo {
  constructor(
    @Inject(InjectedConstants.database_connection) private pool: Pool,
  ) {}

  public async createOneUser(createUserDto: CreateUserDto): Promise<IUser> {
    const createUserQuery: IPreparedQuery = {
      name: 'create-user',
      text: `
      INSERT INTO 
          users (first_name, last_name, email, username) 
      VALUES 
          ($1, $2, $3, $4) 
      RETURNING *;`,
      values: [
        createUserDto.first_name,
        createUserDto.last_name,
        createUserDto.email,
        createUserDto.username,
      ],
    };

    const result = (await this.pool.query<IUser>(createUserQuery)).rows[0];

    return result;
  }

  public async findOneUser(userId: number): Promise<IPartialUser> {
    const getOneUserQuery: IPreparedQuery = {
      name: 'find-one-user',
      text: `
            SELECT
                users.user_id,
                users.username,
                users.email
            FROM
                users
            WHERE
                users.user_id = $1 AND
                1=1
            ;`,
      values: [userId],
    };

    const user = (await this.pool.query<IPartialUser>(getOneUserQuery)).rows[0];

    if (!user) {
      throw new ResourceNotFoundError(
        `Unable to find a user with ID of ${userId}`,
      );
    }

    return user;
  }

  /**
   *
   * @param userId
   * @param updateUserDto
   * @returns Updates users first name, last name, or username
   */
  public async updateUserInfo(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<IUser> {
    //first, let's build our update query for optional field updates
    const updateUserQuery: IPreparedQuery = buildUpdateQuery(
      'users',
      updateUserDto,
      `user_id = ${userId}`,
      userId,
    );

    const updatedUser = (await this.pool.query<IUser>(updateUserQuery)).rows[0];

    if (!updatedUser) {
      throw new ResourceNotFoundError(
        `Unable to find a user to update with ID of ${userId}`,
      );
    }

    return updatedUser;
  }

  /**
   *
   * @param userId
   * @param updateEmailDto
   * @returns updates the user's email in the system.  Will only happen post-confirmation
   */
  public async updateUserEmail(
    userId: number,
    updateEmailDto: UpdateEmailDto,
  ): Promise<IUser> {
    const updateUserEmailQuery: IPreparedQuery = buildUpdateQuery(
      'users',
      updateEmailDto,
      `user_id = ${userId}`,
      userId,
      'email',
    );

    const updatedUser = (await this.pool.query<IUser>(updateUserEmailQuery))
      .rows[0];

    if (!updatedUser) {
      throw new ResourceNotFoundError(
        `Unable to find and update the email of user ${userId}`,
      );
    }

    return updatedUser;
  }

  public async verifyUser(userId: number): Promise<IUser> {
    const verifyUserQuery: IPreparedQuery = {
      name: 'verify-user',
      text: `
            UPDATE
                users
            SET
                is_verified = true
            WHERE
                user_id = $1 AND
                1=1
            RETURNING *
            ;`,
      values: [userId],
    };

    const verifiedUser = (await this.pool.query<IUser>(verifyUserQuery))
      .rows[0];

    if (!verifiedUser) {
      throw new ResourceNotFoundError(
        `Unable to find and verify a user with ID of ${userId}`,
      );
    }

    return verifiedUser;
  }

  public async updateUserNotifications(
    userId: number,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<IUserNotificationSettings> {
    const updateNotificationSettingsQuery: IPreparedQuery = buildUpdateQuery(
      'user_notification_settings',
      updateNotificationDto,
      `WHERE user_id = ${userId}`,
      userId,
    );

    const updatedSettings = (
      await this.pool.query<IUserNotificationSettings>(
        updateNotificationSettingsQuery,
      )
    ).rows[0];

    if (!updatedSettings) {
      throw new ResourceNotFoundError(
        `Unable to find and update notification settings for user with ID of ${userId}`,
      );
    }

    return updatedSettings;
  }

  /**
   *
   * @param email
   * @returns boolean - checks if an email is taken or not
   */
  public async checkEmailAvailable(email: string) {
    const checkEmailQuery: IPreparedQuery = {
      name: 'check-email-taken',
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          email like $1 AND
          1=1
        ;`,
      values: [email],
    };

    const isEmailTaken = (await this.pool.query<IUser>(checkEmailQuery))
      .rows[0];

    if (!isEmailTaken) {
      return true;
    }

    return false;
  }

  /**
   *
   * @param userName
   * @returns bool - checks whether a username is taken or not
   */
  public async checkUserNameAvailable(userName: string) {
    const checkUserNameQuery: IPreparedQuery = {
      name: 'check-username-taken',
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          username LIKE $1 AND
          1=1
        ;`,
      values: [userName.toLowerCase()],
    };

    const isUserNameTaken = (await this.pool.query<IUser>(checkUserNameQuery))
      .rows[0];

    if (!isUserNameTaken) {
      return true;
    }

    return false;
  }
}
