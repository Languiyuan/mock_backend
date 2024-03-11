import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'folder',
})
export class Folder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
    comment: '目录名称',
  })
  name: string;

  @Column({
    comment: '项目id',
  })
  projectId: number;

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
