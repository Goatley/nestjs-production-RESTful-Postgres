import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

//import modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    UserModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [Logger],
})
export class AppModule {}
