import { Module, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from '../database/database.module';
import { UserRepo } from './repositories/user.repo';
import { UserProviders } from './user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [Logger, UserService, UserRepo, ...UserProviders],
})
export class UserModule {}
