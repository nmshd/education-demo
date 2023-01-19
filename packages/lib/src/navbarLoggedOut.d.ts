import { SvelteComponentTyped } from "svelte";
import type { Color } from "sveltestrap/src/shared";

export default class NavbarLoggedOut extends SvelteComponentTyped<{
  siteConfig: any;
  onlyNavbar?: boolean;
  color?: Color;
}> {}
