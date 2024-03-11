import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MockService } from './mock.service';
import { CreateMockDto } from './dto/create-mock.dto';
import { UpdateMockDto } from './dto/update-mock.dto';

@Controller('mock')
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @Post('*')
  create(@Body() createMockDto: any) {
    // return this.mockService.create(createMockDto);
    console.log('createMockDto', createMockDto);
    return 'post 123';
  }

  @Get('*')
  findAll() {
    // return this.mockService.findAll();
    return '123123';
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.mockService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateMockDto: UpdateMockDto) {
  //   return this.mockService.update(+id, updateMockDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.mockService.remove(+id);
  // }
}
