import { Injectable } from '@nestjs/common';
import { CreateMockDto } from './dto/create-mock.dto';
import { UpdateMockDto } from './dto/update-mock.dto';

@Injectable()
export class MockService {
  create(createMockDto: CreateMockDto) {
    return 'This action adds a new mock';
  }

  findAll() {
    return `This action returns all mock`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mock`;
  }

  update(id: number, updateMockDto: UpdateMockDto) {
    return `This action updates a #${id} mock`;
  }

  remove(id: number) {
    return `This action removes a #${id} mock`;
  }
}
