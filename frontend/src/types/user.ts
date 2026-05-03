export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}
