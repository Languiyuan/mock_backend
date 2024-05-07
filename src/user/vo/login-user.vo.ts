interface UserInfo {
  id: number;

  username: string;

  isFrozen: boolean;

  isAdmin: boolean;

  createTime: number;
}
export class LoginUserVo {
  userInfo: UserInfo;

  accessToken: string;

  refreshToken: string;
}
