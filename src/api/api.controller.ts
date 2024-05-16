import {
  Controller,
  Post,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiService } from './api.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { ApiDto } from './dto/api.dto';
import { Response } from 'express';
import * as fs from 'fs-extra';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  // 添加接口
  @Post('add')
  @RequireLogin()
  async addApi(@UserInfo('userId') userId: number, @Body() apiDto: ApiDto) {
    return await this.apiService.addApi(userId, apiDto);
  }

  // 删除接口
  @Post('remove')
  @RequireLogin()
  async removeApi(
    @UserInfo('userId') userId: number,
    @Body('id') id: number,
    @Body('projectId') projectId: number,
  ) {
    return await this.apiService.removeApi(userId, id, projectId);
  }

  // 批量删除接口
  @Post('batchRemove')
  @RequireLogin()
  async batchRemoveApi(
    @UserInfo('userId') userId: number,
    @Body('ids') ids: number[],
    @Body('projectId') projectId: number,
  ) {
    return await this.apiService.batchRemoveApi(userId, ids, projectId);
  }

  // 编辑接口
  @Post('edit')
  @RequireLogin()
  async editApi(@UserInfo('userId') userId: number, @Body() apiDto: ApiDto) {
    return await this.apiService.editApi(userId, apiDto);
  }

  // 查询api列表接口
  @Post('query')
  @RequireLogin()
  async queryApi(
    @UserInfo('userId') userId: number,
    @Body('projectId') projectId: number,
    @Body('folderId') folderId: number | null,
    @Body('name') name: string,
    @Body('url') url: string,
    @Body('pageNo') pageNo: number,
    @Body('pageSize') pageSize: number,
  ) {
    return await this.apiService.queryApi(
      userId,
      projectId,
      folderId,
      name,
      url,
      pageNo,
      pageSize,
    );
  }

  // 查询单个接口的详情
  @Post('queryApiDetail')
  @RequireLogin()
  async queryApiDetail(@Body('id') id: number) {
    return await this.apiService.queryApiDetail(id);
  }

  // 查询api历史
  @Post('queryHistory')
  @RequireLogin()
  async queryHistory(
    @Body('apiId') apiId: number,
    @Body('pageNo') pageNo: number,
    @Body('pageSize') pageSize: number,
  ) {
    return await this.apiService.queryHistory(apiId, pageNo, pageSize);
  }

  // 移动Api
  @Post('moveApi')
  @RequireLogin()
  async moveApi(
    @UserInfo('userId') userId: number,
    @Body('id') id: number,
    @Body('folderId') folderId: number,
  ) {
    return await this.apiService.moveApi(userId, id, folderId);
  }

  // 导出项目所有api  json文件
  @Post('exportProjectAllApi')
  @RequireLogin()
  async exportProject(
    @Res() res: Response,
    @Body('projectId') projectId: number,
  ) {
    const list = await this.apiService.exportProjectAllApi(projectId);
    const filename = `lan_Mock_project_${new Date().getTime()}.json`;
    // 生成 json 文件内容，
    await fs.writeJson(filename, list);
    const content = fs.readFileSync(filename);
    res.setHeader('Content-Type', 'application/json');
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(content);
    await fs.unlink(filename);
  }

  // 导入项目文件 api 并创建相应api
  @Post('uploadProjectFile')
  @UseInterceptors(FileInterceptor('projectFile', { dest: 'uploads' }))
  async uploadProjectFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body,
  ) {
    console.log('file', file);
    console.log('body', body);
    // 读取文件内容
    fs.readFile(file.path, 'utf8')
      .then((data) => {
        // 文件内容现在存储在 data 变量中
        console.log('文件内容:', data);

        // 如果内容是 JSON 格式，你可以解析它
        try {
          const jsonData = JSON.parse(data);
          console.log('JSON 数据:', jsonData);
          // 删除文件
          fs.unlink(file.path);
        } catch (error) {
          console.error('解析 JSON 时发生错误:', error);
        }
      })
      .catch((err) => {
        console.error('读取文件时发生错误:', err);
      });
  }
}
