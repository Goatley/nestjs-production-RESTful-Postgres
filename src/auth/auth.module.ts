import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DatabaseModule,
  ],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
