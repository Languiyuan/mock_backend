import { IsNotEmpty, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({
    message: '用户名不能为空',
  })
  username: string;

  @IsNotEmpty({
    message: '密码不能为空',
  })
  @MinLength(6, {
    message: '密码不能少于 6 位',
  })
  password: string;

  @IsNotEmpty({
    message: '是否是管理员',
  })
  isAdmin: boolean;
}
