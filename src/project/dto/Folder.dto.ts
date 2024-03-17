import { IsNotEmpty } from 'class-validator';

export class FolderDto {
  @IsNotEmpty({
    message: '目录不能为空不能为空',
  })
  folderName: string;

  @IsNotEmpty({
    message: '项目Id不能为空',
  })
  projectId: number;
}
