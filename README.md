# nmshd-login-demo

This is a demo website to demostrate how a login with Enmeshed could be implemented.
The Website is written in Typescrit using the Svelte framework in the fontend and express in the backend.
The identity-provider in use is keycloak.

## Keycloak setup:

The setup is automated

## Public interfaces

These interfaces do not need an authenticated user to be called

### Get Routes

---

#### GET /api/v1/session

Checks if the current Browser Session is logged in and returns the logged in User.
If there is no logged in User it returns an empty JSON.

Sample response:

```json
{
  "exp": 1651564754,
  "iat": 1651564454,
  "jti": "64db6492-de3d-4c3e-ba37-4e8c53ed3885",
  "iss": "http://keycloak:8080/realms/demo",
  "aud": ["account", "demo-client"],
  "sub": "1d1fb471-9ce6-4004-9c3b-f8f52148d620",
  "typ": "Bearer",
  "azp": "admin-cli",
  "session_state": "689c035e-ed77-4241-8c55-d00a2480519b",
  "acr": "1",
  "allowed-origins": ["*"],
  "realm_access": { "roles": ["offline_access", "uma_authorization", "default-roles-demo"] },
  "resource_access": { "account": { "roles": ["manage-account", "manage-account-links", "view-profile"] } },
  "scope": "email profile",
  "sid": "689c035e-ed77-4241-8c55-d00a2480519b",
  "email_verified": false,
  "name": "Korbinian Flietel",
  "preferred_username": "blubibubi",
  "given_name": "Korbinian",
  "family_name": "Flietel",
  "email": "korbinian.flietel@js-soft.com",
  "attributes": { "enmeshedAddress": ["id1KZZMGaQ6fJAq7XfDBRa5bYMFn4yhbmFKj"] }
}
```

#### GET /api/v1/keycloakConfig

Returns the Configurations of the Keycloak server relevant to the Frontend.

Sample response:

```json
{
  "realm": "demo",
  "auth-server-url": "http://localhost:8080/",
  "ssl-required": "external",
  "resource": "demo-client",
  "public-client": true,
  "confidential-port": 0
}
```

#### GET /api/v1/registrationQR?username={$username}

Expects a username, checks if it is not taken yet and returns the byte string array
of the QR-code that can be used to display it.

Sample usage:

```ts
const response = await axios.get(`api/v1/registrationQR?username=${username}`);
const imagebuffer = window.btoa(response.data.join(""));
...
<img alt="QR_Code" src=`data:image/png;base64,${imageBuffer}` />
```

#### GET /api/v1/onboardingQR

Expects a username, the user with that Username has to exist and not be connected to Enmeshed.
Returns the byte string array of the QR-code that can be used to display it.

Sample usage:

```ts
const response = await axios.get(`api/v1/onboardingQR?username=${myUserName}`);
const imageBuffer = window.btoa(response.data.join(""));
...
<img alt="QR_Code" src=`data:image/png;base64,${imageBuffer}` />
```

#### GET /api/v1/nmshdUserLogin?OTP={$OTP}

This interface is not intended for direct access, it is what the automated link (by the enmeshed User login flow) will use. It Expects a OTP that is a generated String (again by the enmeshd User login flow), if the OTP is associated to the user it returns the corresponding Site with further instructions if there is no associated user it will return a error message.

#### GET /api/v1/config

Returns configuration details for Frontend use only really usefull if one uses the Svelte Version/Lib.

Sample response:

```json
{
  "companyName": "",
  "registration": true,
  // Routes that are open non logged in users
  "open": [],
  // Routes/Dropdowns that are on the main part of the Navbar
  "main": [],
  // Routes that are on the dropdown part of the profile
  "profile": [],
  // Data that users have to share in order to register
  "userData": {
    "username": { "name": "username", "type": "text" },
    "password": { "name": "password", "type": "password" },
    // These req and opt arrays are important because thy are used to generate the QR code
    "req": [
      { "name": "firstName", "type": "text" },
      { "name": "lastName", "type": "text" }
    ],
    "opt": [
      { "name": "email", "type": "email" },
      { "name": "phone", "type": "tel" }
    ]
  }
}
```

### Post Routes

---

#### POST /api/v1/nmshdLogin

Expected Body:

```json
{
  "username": string
}
```

**Possible Failures (code: 400):**

- No username
- No connected enmeshed address

Generates OTP and a numeric Code and saves it in the DB with assosiation to the User and the Browser session.
Sends Message to User (through Enmeshed) with Metainformation about the Browser making the Request and the link to confirm Login with the OTP `(see GET /nmshdUserLogin?OTP={$OTP})`

Returns the Code generated because it is needed to confirm Login.

#### POST /api/v1/register

Expected Body:

```json
{
  "username": string,
  "password": string,
  "email"?: string,
  "lastName"?: string,
  "firstName"?: string,
  // In the attributes map everything should be sent that is not covered above
  "attributes"?: Map<string,string>
}
```

**Possible Failures (code: 400):**

- No username / password given
- Username taken

Registers a User and emits a `register` event to the socket associated with the session containing the Keycloak tokens of the newly registered User

#### POST /api/v1/confirmCode

Expected Body:

```json
{
  "code": number,
  "otp": string
}
```

**Possible Failures (code: 400):**

- No code / otp given
- Code is false

**Possible Failures (code: 410):**

- No open Login request

This route is used in the Last step of the enmeshed login flow. It validates the code in relation to the otp. If the code is correct it loggs the session that is assisiated with the otp in using the socket `register` event sending the Keycloak Tokens.

#### POST /api/v1/cancelLogin

deletes All open Login requests asosiated with the sessionId of the caller

#### POST /api/v1/sendMessage

Expected Body:

```ts
{
  "username": string,
  "content": {
    "subject": string,
    "body": string,
  },
  "attachments?": Attachment[],
  "data?": {
    "insurance": string,
    "sum": number
  }
}

// Attachment:
{
  "title": string,
  "description": string,
  "path": string,
  "filename": string
}
```

**Possible Failures (code: 400):**

- No username / content given
- User is not connected with Enmeshed
- Bad file path

**Possible Failures (code: 500):**

- Error uploading File
- Error sending message

Sends Message to the Users Enmeshed-address with an optional array of Attachments. Returns code 200 on success.
If the feature is enabled and the subject includes Insurance or Versicherung the data object will be used to create a
PDF attachment with the details.

## Private interfaces

These interfaces need an authenticated user to be called and will fail otherwise.
_All genericDB routes can be blocked with config "server.enableGenericDbAccess" set to false_

#### POST /api/v1/auth/login

Validates authorisation Header and sets User Session.

Expected Headers:

```json
{
  "authorization": "Bearer $access_token"
}
```

#### POST /api/v1/auth/logout

Invalidates current user session and redirects to root url.

#### GET /api/v1/auth/genericDB?{$any}

Converts Query to filter using the QueryTranslator and retruns Arbitrary JSON depending on what was written to the DB and the Filter.

#### POST /api/v1/auth/genericDB

Expected Body:
Arbitrary JSON that will be written in Db.

```json
{
  "payload": { "x": 5000, "y": 0.1 }
}
```

Writes Body in Database

#### PATCH /api/v1/auth/genericDB

Expected Body example:

```json
{
  "filter": { "x": { "$gte": 5000 } },
  "data": { "y": 0.875619143161488 }
}
```

Updates all entries that match filter with data

Return Value:

```json
{ "acknowledged": boolean, "modifiedCount": number, "upsertedId": null, "upsertedCount": number, "matchedCount": number }
```

#### DELETE /api/v1/auth/genericDB

Expected Body example (can again be arbitrary):

```json
{
  "filter": { "x": { "$gte": 5000 } }
}
```

Deletes all entries that match the Filter.

Return Value:

```json
{ "acknowledged": boolean, "deletedCount": number }
```
