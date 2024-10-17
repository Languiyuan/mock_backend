import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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

export class EditProjectDto extends CreateProjectDto {
  @IsNotEmpty({
    message: '项目ID不能为空',
  })
  projectId: number;

  @IsOptional()
  @IsNotEmpty({
    message: 'API导出模板不能为空',
  })
  @IsString({
    message: 'API导出模板必须是字符串',
  })
  @MaxLength(1000, {
    message: 'API导出模板长度不能超过1000个字符',
  })
  apiExportTemplate?: string; // 可选属性，可以是 string 或 null

  @IsOptional()
  @IsString({
    message: 'API导出模板必须是字符串',
  })
  @MaxLength(10000, { message: '返回设置不能超过10000个字符' })
  proxyInfo: string;
}
