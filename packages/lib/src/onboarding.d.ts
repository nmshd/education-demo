import { SvelteComponentTyped } from "svelte";
import type { UserInfo } from "./types.svelte";

export default class Onboarding extends SvelteComponentTyped<{ userInfo: UserInfo; i?: Info[] }> {}

export interface Info {
  title: string;
  body: {
    subtitle: string;
    content: string;
  };
  button?: {
    text: string;
    link: string;
  };
  footer?: {
    text: string;
    icon?: string;
  };
}

export interface EnmeshedIntro {
  title: string;
  body: string;
  button: {
    text: string;
    link: string;
  };
  onboardingIntro: string;
}
