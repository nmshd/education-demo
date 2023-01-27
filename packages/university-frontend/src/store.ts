import Keycloak from "keycloak-js";
import { writable } from "svelte/store";

export class ApplicationState {
  public birthDate?: {
    day?: number;
    month?: number;
    year?: number;
  };
  public birthPlace?: {
    city?: string;
    country?: string;
  };
  public nationality?: string;
  public sex?: string;
  public email?: string;
  public streetAddress?: {
    street?: string;
    houseNumber?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
  public phoneNumber?: string;

  public constructor() {
    this.birthDate = undefined;
    this.birthPlace = undefined;
    this.email = undefined;
    this.nationality = undefined;
    this.phoneNumber = undefined;
    this.sex = undefined;
    this.streetAddress = undefined;
  }
}

export enum Status {
  Requested = 33,
  Sent = 66,
  Received = 100,
  Idle
}

export const keycloakInstance = Keycloak("/api/v1/keycloakConfig");

export const siteConfig = writable<any>();

export const userInfo = writable<any>();

export const application = writable<ApplicationState>(new ApplicationState());

export const applicationRequestStatus = writable<Status>(Status.Idle);

export const loggedIn = writable<boolean | undefined>();
