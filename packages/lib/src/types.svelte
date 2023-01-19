<script lang="ts" context="module">
  import type { Dropdown } from "sveltestrap";
  import type { Route } from "./navbarLoggedIn";
  import type { Info } from "./onboarding";

  export enum NavbarTypes {
    Dropdown,
    Link,
    Error
  }

  export interface UserInfo extends Record<string, any> {
    name: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    preferred_username: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    given_name?: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    family_name?: string;
    email?: boolean;
    attributes?: UserAttributes;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    realm_access?: RealmAccess[];
    roles?: string[];
  }

  export interface UserAttributes extends Record<string, any> {
    enmeshedAddress?: string;
  }

  interface RealmAccess extends Record<string, any> {
    id: string;
    name: string;
    description: string;
    composite: boolean;
    clientRole: boolean;
    containerId: string;
  }

  export const keycloakBasicUserInfo = ["firstName", "lastName", "email"];

  export interface KeycloakInstance extends Record<string, any> {
    authServerUrl: string;
    authenticated: boolean;
    clientId: string;
    realm: string;
  }

  export interface SiteConfig extends Record<string, any> {
    companyName: string;
    enableBasicAuth: boolean;
    main: [Route | Dropdown];
    open: any[];
    profile: [Route];
    onboardingInfo: [Info];
    registration: boolean;
    userData: any;
  }
</script>
