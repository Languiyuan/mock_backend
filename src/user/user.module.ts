import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/User.entity';
import { Permission } from './entities/permissions.entity';
import { Role } from './entities/role.entity';
import { ProjectModule } from 'src/project/project.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission]), ProjectModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
