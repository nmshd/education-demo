import { SvelteComponentTyped } from "svelte";
import type { KeycloakInstance } from "./types.svelte";

export default class Login extends SvelteComponentTyped<{
  normalLoginTitle?: string;
  enmeshedLoginTitle?: string;
  enableBasicAuth?: boolean;
  keycloakInstance: KeycloakInstance;
  loggedIn: Writable<boolean | undefined>;
  userInfo: Writable<any>;
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  adminOnly?: boolean;
}> {}
