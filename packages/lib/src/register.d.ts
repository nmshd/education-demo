import { SvelteComponentTyped } from "svelte";
import type { InputType } from "sveltestrap/src/Input";

export default class Register extends SvelteComponentTyped<{
  enableBasicAuth?: boolean;
  userData: UserData;
}> {}

interface UserData {
  username: { name: string; type: InputType };
  password: { name: string; type: InputType };
  req: [{ name: string; type: InputType }?];
  opt: [{ name: string; type: InputType }?];
}
