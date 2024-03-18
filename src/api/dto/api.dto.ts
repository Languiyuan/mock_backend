import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ApiDto {
  @IsOptional()
  id: number;

  @IsNotEmpty({
    message: 'projectId不能为空',
  })
  projectId: number;

  @IsNumber({}, { message: 'folderId must be a number' })
  @IsOptional()
  folderId: number | null;

  @IsNotEmpty({
    message: 'name不能为空',
  })
  name: string;

  @IsNotEmpty({
    message: 'url不能为空',
  })
  url: string;

  @IsString()
  @IsNotEmpty({ message: 'mockRule不能为空' })
  @MaxLength(5000, { message: '用户名长度不能超过5000个字符' })
  mockRule: string;

  @IsNotEmpty({
    message: 'method不能为空',
  })
  method: string;

  @IsNumber()
  delay: number;

  @IsNotEmpty({
    message: 'description不能为空',
  })
  description: string;

  @IsIn([0, 1], { message: '数字只能是 0 或 1' })
  on: number;
}
