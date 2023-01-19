import { SvelteComponentTyped } from "svelte";
import type { UserInfo } from "./types.svelte";

export default class Profile extends SvelteComponentTyped<{
  userInfo: UserInfo;
  params: any;
  successMessage?: string;
}> {}
