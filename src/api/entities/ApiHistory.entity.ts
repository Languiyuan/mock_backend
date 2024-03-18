import { Api } from './Api.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'apiHistory',
})
export class ApiHistory extends Api {
  @Column({
    comment: 'api id',
  })
  apiId: number;

  @Column({
    comment: '操作类型',
  })
  operateType: string;
}
