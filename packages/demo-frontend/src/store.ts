import Keycloak from "keycloak-js";
import { writable } from "svelte/store";

export const keycloakInstance = Keycloak("/api/v1/keycloakConfig");

export const siteConfig = writable<any>();

export const userInfo = writable<any>();

export const loggedIn = writable<boolean | undefined>();
