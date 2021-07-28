import { Injectable, Inject, Logger } from '@nestjs/common';
import { IUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectedConstants } from '../config/constants.config';
import { UserRepo } from './repositories/user.repo';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateNotificationDto } from './dto/update-notifications.dto';
import { UserEvents } from './events/user.events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IUserEmailUpdated,
  IUserEvent,
  IUserUpdatedEvent,
} from './interfaces/user.events.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject(InjectedConstants.user_repo) private userRepo: UserRepo,
    private eventEmitter: EventEmitter2,
    private readonly logger: Logger,
  ) {}

  /**
   *
   * @param createUserDto
   * @returns returns and instance of IUser for the newly created user
   * @event releases the user-created event
   */
  async createOne(createUserDto: CreateUserDto): Promise<IUser> {
    //let's attempt to create a new user
    const newUser = await this.userRepo.createOneUser(createUserDto);

    const userCreatedEvent: IUserEvent = {
      userId: newUser.user_id,
    };

    //now, let's emit our 'user created' event
    this.eventEmitter.emit(UserEvents.created, userCreatedEvent);

    return newUser;
  }

  /**
   *
   * @param userId
   * @returns returns and IUser that matches the corresponding userId
   */
  async findOne(userId: number) {
    const user = await this.userRepo.findOneUser(userId);

    return user;
  }

  /**
   *
   * @param userId
   * @param updateUserDto
   * @returns returns the UPDATED user object
   */
  async updateOne(userId: number, updateUserDto: UpdateUserDto) {
    //let's attempt to update a user's profile
    const updatedUser = await this.userRepo.updateUserInfo(
      userId,
      updateUserDto,
    );

    //now, let's create the updated event and send it out with any updated fields
    const userUpdatedEvent: IUserUpdatedEvent = {
      userId: updatedUser.user_id,
      ...updateUserDto,
    };

    this.eventEmitter.emit(UserEvents.updated, userUpdatedEvent);

    return updatedUser;
  }

  /**
   *
   * @param userId
   * @param updateEmailDto
   * @returns returns the UPDATED user object (with the new email)
   */
  async updateOneEmail(userId: number, updateEmailDto: UpdateEmailDto) {
    const updatedUser = await this.userRepo.updateUserEmail(
      userId,
      updateEmailDto,
    );

    //now, let's fire off our event and notify the new email account
    const userEmailUpdatedEvent: IUserEmailUpdated = {
      userId: userId,
      email: updateEmailDto.email,
    };

    this.eventEmitter.emit(UserEvents.updateEmail, userEmailUpdatedEvent);

    return updatedUser;
  }

  async generateEmailUpdateLink(userId: number) {
    //first, let's generate an email verification token and store it.
    //now, let's send out our event to start the email process
  }

  async generateVerifyAccountLink(userId: number) {
    //first, let's generate our unique token to verify a new account
    //now, let's send our event to kick off the verification process
  }

  /**
   *
   * @param userId
   * @returns returns the UPDATED user object that is now verified
   */
  async verifyOne(userId: number) {
    const verifiedUser = await this.userRepo.verifyUser(userId);

    return verifiedUser;
  }

  /**
   *
   * @param userId
   * @param updateNotificationDto
   * @returns returns the updated NotificationSettings object
   */
  async updateNotificationSettings(
    userId: number,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    const updatedSettings = await this.userRepo.updateUserNotifications(
      userId,
      updateNotificationDto,
    );

    return updatedSettings;
  }

  /**
   *
   * @param email
   * @returns boolean -checks whether or not the email is available or taken
   */
  async checkEmailAvailable(email: string): Promise<boolean> {
    const isEmailAvailable = await this.userRepo.checkEmailAvailable(email);

    return isEmailAvailable;
  }

  /**
   *
   * @param userName
   * @returns bool - checks whether or not the username is taken or available
   */
  async checkUserNameAvailable(userName: string) {
    const isUserNameAvailable = await this.userRepo.checkUserNameAvailable(
      userName,
    );

    return isUserNameAvailable;
  }
}
