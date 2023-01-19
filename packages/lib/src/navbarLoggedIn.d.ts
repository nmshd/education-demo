import { SvelteComponentTyped } from "svelte";

export default class NavbarLoggedIn extends SvelteComponentTyped<{
  userName: string;
  siteConfig: any;
  color?: Color;
}> {}

export interface Route {
  name: string;
  link: string;
  icon?: string;
  active?: boolean;
}

export interface Dropdown {
  name: string;
  routes: Route[];
  icon?: string;
}
