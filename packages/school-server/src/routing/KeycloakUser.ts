export interface KeycloakUser extends Record<string, any> {
  id: string;
  createdTimestamp: number;
  username: string;
  enabled: boolean;
  totp: boolean;
  emailVerified: boolean;
  email: string;
  attributes?: UserAttributes;
  disableableCredentialTypes: unknown[];
  requiredActions: unknown[];
  notBefore: number;
  access: UserAccess;
}

export interface KeycloakUserWithRoles extends KeycloakUser {
  roles: string[];
}

export interface UserAttributes extends Record<string, any> {
  enmeshedAddress?: string;
}

export interface UserAccess {
  manageGroupMembership: boolean;
  view: boolean;
  mapRoles: boolean;
  impersonate: boolean;
  manage: boolean;
}

export interface Student extends Record<string, any> {
  firstName?: string;
  lastName?: string;
}
