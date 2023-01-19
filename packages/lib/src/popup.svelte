<script lang="ts">
  import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "sveltestrap";
  import type { Button as btn } from "./popup";

  export let header = "Popup";
  export let data = "";
  export let open = false;
  export let buttons: btn[] = [];

  const toggle = () => {
    open = !open;
    buttons = [];
  };
</script>

{#if open}
  <div>
    <Modal isOpen={open} {toggle}>
      <ModalHeader {toggle}>{header}</ModalHeader>
      <ModalBody>{@html data}</ModalBody>
      <ModalFooter>
        {#each buttons as button}
          <a href={button.target ? button.target : "#"}><Button on:click={toggle}>{button.text}</Button></a>
        {/each}
      </ModalFooter>
    </Modal>
  </div>
{/if}

<style>
  a {
    color: #ffffff;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  a:visited {
    color: #ffffff;
  }
</style>
