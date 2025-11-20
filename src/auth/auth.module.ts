import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../database/database.module';
import { AuthService } from './auth.service';
import { AuthTestController } from './auth-test.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtDynamicGuard } from './guards/jwt-dynamic.guard';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthTestController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, JwtDynamicGuard],
  exports: [AuthService, JwtAuthGuard, JwtDynamicGuard],
})
export class AuthModule {}

