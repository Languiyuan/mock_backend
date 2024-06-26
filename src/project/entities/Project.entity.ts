import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'project',
})
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
    comment: '名称',
  })
  name: string;

  @Column({
    length: 50,
    comment: '项目凭证id',
  })
  sign: string;

  @Column({
    length: 100,
    comment: '接口基础url',
  })
  baseUrl: string;

  @Column({
    length: 200,
    comment: '项目描述',
  })
  description: string;

  @Column({
    comment: '创建者id',
  })
  createUserId: number;

  @Column({
    comment: '更新人id',
  })
  updateUserId: number;

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
