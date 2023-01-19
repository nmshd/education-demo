import { SvelteComponentTyped } from "svelte";

export default class Popup extends SvelteComponentTyped<{
  open: boolean;
  header: string;
  data: string;
  buttons?: Button[];
}> {}

export interface Button {
  text: string;
  target?: string;
}
