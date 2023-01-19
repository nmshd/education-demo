<script lang="ts" context="module">
  import axios from "axios";
  import { NavbarTypes } from "./types.svelte";

  export async function logout(): Promise<void> {
    try {
      await axios.post("api/v1/auth/logout");
      location.reload();
    } catch (e) {
      location.reload();
    }
  }

  export function validate(route: any): NavbarTypes {
    if (route.name && route.link) {
      return NavbarTypes.Link;
    } else if (route.name && Array.isArray(route.routes)) {
      return NavbarTypes.Dropdown;
    }
    return NavbarTypes.Error;
  }

  export async function generateQRCode(username: string): Promise<string> {
    const response = await axios.get(`api/v1/registrationQR?username=${username}`);
    return window.btoa(response.data.join(""));
  }
</script>
