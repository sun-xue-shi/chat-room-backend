export interface JwtUserData {
  userId: number;
  userName: string;
}

declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}
