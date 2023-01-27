<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";
  import { Button, FormGroup, Image, Input, Progress } from "sveltestrap";
  import { application, applicationRequestStatus, Status, userInfo } from "../store";
  export let stateIndex: number;

  let imageBuffer: string;

  async function startOnboarding() {
    try {
      if (!$userInfo.attributes?.enmeshedAddress) {
        const response = await axios.get(`api/v1/onboardingQR?username=${$userInfo.preferred_username}`);

        imageBuffer = window.btoa(response.data.join(""));
      }
    } catch (e) {
      alert(e);
    }
  }

  async function requestData(e: Event) {
    $applicationRequestStatus = Status.Requested;
    e.preventDefault();
    e.stopPropagation();
    if (!e.target) {
      throw new Error("send Details must be called by a Button click");
    }
    try {
      await axios.post("/api/v1/auth/sendApplicationRequest");
      setTimeout(() => {
        $applicationRequestStatus = Status.Sent;
      }, 1000);
    } catch (error) {
      console.log(error);
    }
  }

  onMount(async () => {
    await startOnboarding();
  });
</script>

<div class="col-66">
  <div class="update">
    <h2 class="display-1">Daten zur Person</h2>
    <hr />

    <form>
      <h3>Persönlicher Daten</h3>
      <br />
      <FormGroup floating label="Vorname*">
        <Input id="firstName" name="firstName" required disabled value={$userInfo.given_name} />
      </FormGroup>
      <FormGroup floating label="Nachname*">
        <Input id="lastName" name="nachname" required disabled value={$userInfo.family_name} />
      </FormGroup>
      <FormGroup floating label="Geburtsdatum*">
        <Input
          id="birth_date"
          type="date"
          name="Geburtsdatum"
          value={$application.birthDate
            ? `${$application.birthDate.year}-${$application.birthDate.month}-${$application.birthDate.day}`
            : ""}
        />
      </FormGroup>
      <FormGroup floating label="Geburtsland*">
        <Input id="birth_country" name="Geburtsland" value={$application.birthPlace?.country ?? ""} />
      </FormGroup>
      <FormGroup floating label="Staatsangehörigkeit*">
        <Input id="nationality" name="Staatsangehörigkeit" value={$application.nationality ?? ""} />
      </FormGroup>
      <FormGroup floating label="Geschlecht*">
        <select id="gender" class="form-select form-select-sm" aria-label=".form-select-sm example" required>
          <option value="M">Männlich</option>
          <option value="W">Weiblich</option>
          <option value="D">Divers</option>
        </select>
      </FormGroup>
      <FormGroup floating label="E-Mail">
        <Input id="e_mail" name="E-mail" value={$application.email ?? ""} />
      </FormGroup>

      <h3>Addresse</h3>
      <FormGroup floating label="Straße, Hausnummer*">
        <Input id="street_num" name="StraßeNummer" value={$application.streetAddress?.houseNumber ?? ""} />
      </FormGroup>
      <FormGroup floating label="PLZ*">
        <Input id="zip" name="PLZ" value={$application.streetAddress?.zipCode ?? ""} />
      </FormGroup>
      <FormGroup floating label="Ort*">
        <Input id="place" name="Ort" value={$application.streetAddress?.city ?? ""} />
      </FormGroup>
      <FormGroup floating label="Land*">
        <Input id="country" name="Land" value={$application.streetAddress?.country ?? ""} />
      </FormGroup>
      <FormGroup floating label="Telefon">
        <Input id="telefone" name="Telefon" value={$application.phoneNumber ?? ""} />
      </FormGroup>
      <br />

      <FormGroup>
        <Button type="submit" color="primary" block on:click={() => stateIndex++}>Weiter</Button>
      </FormGroup>
    </form>
  </div>
</div>
<div class="col-33 flex">
  <div class="flex-content">
    <h3>Automatisch ausführen mit Enmeshed</h3>
    {#if !$userInfo.attributes?.enmeshedAddress}
      <Image alt="QR_Code" src="data:image/png;base64,{imageBuffer}" />
    {:else}
      <button
        id="submit"
        data-label="submit"
        on:click={async (e) => {
          await requestData(e);
        }}>Daten anfragen</button
      >

      {#if $applicationRequestStatus !== Status.Idle}
        <Progress
          value={$applicationRequestStatus}
          color={$applicationRequestStatus === Status.Received ? "success" : "primary"}
        >
          {#if $applicationRequestStatus === Status.Requested}
            Anfrage wird erstellt!
          {:else if $applicationRequestStatus === Status.Sent}
            Anfrage gesendet!
          {:else}
            Antwort erhalten!
          {/if}
        </Progress>
      {/if}
    {/if}
  </div>
</div>

<style>
  hr {
    background-color: gray;

    border-width: 10px;
  }

  .flex {
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  .flex-content {
    padding-top: 24px;
  }

  h2 {
    color: #0158ab;
    font-size: 30px;
    font-weight: bold;
  }

  h3 {
    color: #0158ab;
    font-size: 20px;
  }

  .update {
    padding: 24px;
    top: 10vh;
    margin: auto;
    text-align: left;
  }

  .col-66 {
    width: 66%;
    padding: 0 18px;
    margin: auto;
  }

  #submit {
    margin-bottom: 1em;
  }
</style>
