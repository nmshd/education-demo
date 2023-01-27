export interface Application {
  birthDate?: {
    day?: number;
    month?: number;
    year?: number;
  };
  birthPlace?: {
    city?: string;
    country?: string;
  };
  nationality?: string;
  sex?: string;
  email?: string;
  streetAddress?: {
    street?: string;
    houseNumber?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
  phoneNumber?: string;
}

export const emptyApplication = (): Application => ({
  birthDate: undefined,
  birthPlace: undefined,
  email: undefined,
  nationality: undefined,
  phoneNumber: undefined,
  sex: undefined,
  streetAddress: undefined
});
