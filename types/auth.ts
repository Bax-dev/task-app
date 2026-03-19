export interface User {
  id: string;
  name: string | null;
  email: string;
  avatar?: string | null;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
}
