import { PartialType } from '@nestjs/mapped-types';
import { CreateMockDto } from './create-mock.dto';

export class UpdateMockDto extends PartialType(CreateMockDto) {}
