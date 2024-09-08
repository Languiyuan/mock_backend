import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { User } from './entities/User.entity';
import { RegisterUserDto } from './dto/RegisterUserDto';
import { Inject } from '@nestjs/common/decorators';
import { RedisService } from 'src/redis/redis.service';
import { HttpException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common/enums';
import { md5 } from 'src/utils';
import { LoginUserDto } from './dto/LoginUserDto';
import { LoginUserVo } from './vo/login-user.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';

@Injectable()
export class UserService {
  private logger = new Logger();

  // 引入 user实例 操作数据库
  @InjectRepository(User)
  private userRepository: Repository<User>;
  // 引入 redis
  @Inject(RedisService)
  private redisService: RedisService;

  async register(user: RegisterUserDto) {
    // 1、获取redis中验证码 判断验证码是不是过期了
    // const captcha = await this.redisService.get(`captcha_${user.email}`);
    // 2、如果不存在就是过期了
    // if (!captcha) {
    //   throw new HttpException('验证码失效', HttpStatus.BAD_REQUEST);
    // }

    // 3、 验证码不正确
    // if (captcha !== user.captcha) {
    //   throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    // }

    // 4、查用户表 判断用户是不是已经存在了
    const findUser = await this.userRepository.findOneBy({
      username: user.username,
    });

    if (findUser) {
      throw new HttpException('用户已经存在', HttpStatus.BAD_REQUEST);
    }

    // 5、成功 存库
    const newUser = new User();
    newUser.username = user.username;
    newUser.password = md5(user.password);
    newUser.isAdmin = user.isAdmin || false;

    try {
      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '注册失败';
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUserDto.username,
      },
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.isFrozen) {
      throw new HttpException(
        '该用户被冻结，请联系管理员',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.password !== loginUserDto.password) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const vo = new LoginUserVo();

    vo.userInfo = {
      id: user.id,
      username: user.username,
      createTime: user.createTime.getTime(),
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
    };

    return vo;
  }

  async findUserById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    };
  }

  async findUserDetailById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    return user;
  }

  async updatePassword(userId: number, passwordDto: UpdateUserPasswordDto) {
    // const captcha = await this.redisService.get(
    //   `update_password_captcha_${passwordDto.email}`,
    // );

    // if (!captcha) {
    //   throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    // }

    // if (captcha !== passwordDto.captcha) {
    //   throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    // }

    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });

    if (foundUser.password === md5(passwordDto.password)) {
      throw new HttpException('新密码不能与旧密码一致', HttpStatus.BAD_REQUEST);
    }

    foundUser.password = md5(passwordDto.password);

    try {
      await this.userRepository.save(foundUser);
      return '密码修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      throw new HttpException('修改密码失败', HttpStatus.BAD_REQUEST);
    }
  }

  // 模糊搜索用户
  async findUserByUsername(username: string) {
    const findUsers = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.username', 'user.id'])
      .where('user.username LIKE :username', { username: `%${username}%` })
      .getMany();
    return findUsers.length ? findUsers.slice(0, 20) : [];
  }

  // 冻结账号
  async freeze(userId: number) {
    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });

    if (foundUser.isAdmin) {
      throw new HttpException('管理员不能被冻结账户', HttpStatus.BAD_REQUEST);
    }

    foundUser.isFrozen = true;

    try {
      await this.userRepository.save(foundUser);
      return '冻结成功';
    } catch (e) {
      this.logger.error(e, UserService);
      throw new HttpException('操作失败, 500', HttpStatus.BAD_REQUEST);
    }
  }

  // 解冻账号
  async unfreeze(userId: number) {
    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });

    if (foundUser.isAdmin) {
      throw new HttpException('管理员不能被冻结账户', HttpStatus.BAD_REQUEST);
    }

    foundUser.isFrozen = false;

    try {
      await this.userRepository.save(foundUser);
      return '解冻成功';
    } catch (e) {
      this.logger.error(e, UserService);
      throw new HttpException('操作失败, 500', HttpStatus.BAD_REQUEST);
    }
  }

  // 获取所有用户
  async getAllUsers(
    username: string,
    isAdminStatus: boolean | undefined,
    pageNo: number,
    pageSize: number,
  ) {
    if (!pageNo || !pageSize) {
      throw new HttpException('请校验传参', HttpStatus.BAD_REQUEST);
    }

    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (username) {
      condition.username = Like(`%${username}%`);
    }
    if (typeof isAdminStatus === 'boolean') {
      condition.isAdmin = isAdminStatus;
    }

    const [findUsers, totalCount] = await this.userRepository.findAndCount({
      where: condition,
      order: {
        id: 'ASC', // 按 id 降序排序
      },
      select: ['id', 'username', 'isFrozen', 'isAdmin'], // 指定要选择的字段
      take: pageSize, // 指定查询数量
      skip: skipCount, // 指定跳过的记录数量
    });

    return { list: findUsers, total: totalCount, pageNo, pageSize };
  }

  async initData() {
    const findData = await this.userRepository.findOne({
      where: { username: 'admin' },
    });

    if (findData) {
      return '初始化已完成，请勿重复';
    }
    const user1 = new User();
    user1.username = 'admin';
    user1.password = md5('123456');
    user1.isAdmin = true;

    await this.userRepository.save(user1);
    return 'success';
  }
}
