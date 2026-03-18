export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    accountStatus: string;
  };
  accessToken: string;
}

export interface SessionInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: string[];
  permissions: string[];
  accountStatus: string;
}
