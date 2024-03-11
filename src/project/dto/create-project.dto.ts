import { IsNotEmpty } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty({
    message: '项目名称不能为空',
  })
  name: string;

  @IsNotEmpty({
    message: '接口基础路径不能为空',
  })
  baseUrl: string;

  @IsNotEmpty({
    message: '接口基础路径不能为空',
  })
  description: string;
}
