import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import {
  ApiAcceptedResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateNotificationDto } from './dto/update-notifications.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}

  @Post()
  @ApiCreatedResponse()
  async createOne(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createOne(createUserDto);
  }

  @Get(':id')
  @ApiOkResponse({ type: Object })
  async findOne(@Param('id') userId: string) {
    return await this.userService.findOne(parseInt(userId));
  }

  @Patch(':id')
  @ApiAcceptedResponse({ type: Object })
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateOne(parseInt(userId), updateUserDto);
  }

  @Patch(':id/email')
  @ApiAcceptedResponse({ type: Object })
  async updateUserEmail(
    @Param('id') userId: string,
    @Body() updateEmailDto: UpdateEmailDto,
  ) {
    return await this.userService.updateOneEmail(
      parseInt(userId),
      updateEmailDto,
    );
  }

  @Patch(':id/notifications')
  @ApiAcceptedResponse({ type: Object })
  async updateUserNotifications(
    @Param('id') userId: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return await this.userService.updateNotificationSettings(
      parseInt(userId),
      updateNotificationDto,
    );
  }

  @Patch(':id/verify')
  @ApiAcceptedResponse({ type: Object })
  async verifyUser(@Param('id') userId: string) {
    return await this.userService.verifyOne(parseInt(userId));
  }

  @Get('/checkEmail')
  @ApiOkResponse({ type: Boolean })
  async checkEmail(@Query('email') email: string) {
    this.logger.log('here');
    return await this.userService.checkEmailAvailable(email);
  }

  @Get('/checkUserName')
  @ApiOkResponse({ type: Boolean })
  async checkUserName(@Query('userName') userName: string) {
    return await this.userService.checkUserNameAvailable(userName);
  }
}
