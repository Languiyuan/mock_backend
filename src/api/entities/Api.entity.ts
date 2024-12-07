import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'api',
})
export class Api {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    comment: '项目id',
  })
  projectId: number;

  @Column({
    length: 50,
    comment: '项目凭证id',
  })
  projectSign: string;

  @Column({
    comment: '创建者id',
  })
  createUserId: number;

  @Column({
    comment: '更新人id',
  })
  updateUserId: number;

  @Column({
    comment: '所属的目录的id',
    nullable: true,
  })
  folderId: number | null;

  @Column({
    length: 100,
    comment: '接口名称',
  })
  name: string;

  @Column({
    length: 200,
    comment: '接口url（除去基础baseurl）',
  })
  url: string;

  @Column({
    type: 'mediumtext',
    comment: '接口内容最长是100000字节',
  })
  mockRule: string;

  @Column({
    length: 10,
    comment: '接口类型',
  })
  method: string;

  @Column({
    comment: '接口返回延迟',
    default: 0,
  })
  delay: number;

  @Column({
    length: 400,
    comment: '接口描述',
  })
  description: string;

  @Column({
    default: 1,
    comment: '接口是否启用',
  })
  on: number;

  @Column({
    default: 0,
    comment: '参数校验是否启用',
  })
  paramsCheckOn: number;

  @Column({
    length: 10000,
    comment: '传参规则',
  })
  params: string;

  @Column({
    comment: '是否删除',
    default: 0,
  })
  isDeleted: number;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
