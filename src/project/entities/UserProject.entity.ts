import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'user_project',
})
export class UserProject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    comment: '创建者id',
  })
  userId: number;

  @Column({
    comment: '项目id',
  })
  projectId: number;

  @Column({
    comment: '是否是创建者',
    default: 0,
  })
  isCreateUser: number;

  @Column({
    comment: '是否被删除',
    default: 0,
  })
  isDeleted: number;
}
