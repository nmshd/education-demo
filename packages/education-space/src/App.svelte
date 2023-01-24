<script>
  import { Accordion, AccordionItem, Button } from "flowbite-svelte";
  import { onMount } from "svelte";

  const items = Array(3);

  onMount(async () => {
    // const state = await axios.get("/state");
    // items[state.data] = true;
  });
</script>

<main>
  <h1 class="header">Bildungsraum</h1>
  <Accordion multiple>
    <h1>Schule</h1>

    <AccordionItem bind:open={items[0]}>
      <span slot="header">Zeugnis über QR-Code in die Wallet importieren</span>
      <div class="mb-2 text-gray-500 dark:text-gray-400 text-left">
        <p>
          Zeugnis über QR-Code in die Wallet importieren Mit dem erfolgreichem Bestehen des Abiturs wir dem Schüler ein
          Zeugnis ausgehändigt. Zusätzlich erhält dieser ein Infomrmationszettel, wie er dieses Zeugnis digital in
          seiner Wallet speichern kann.<br />
          Anforderungen:
        </p>
        <ul class="list-disc list-inside">
          <li>keine</li>
        </ul>
        Ergebnisse:
        <ul class="list-disc list-inside">
          <li>Zeugnis in PDF Form</li>
          <li>Zeugnis in maschinlesbarer Form</li>
          <li>Metadaten</li>
        </ul>
      </div>
      <div class="align-right">
        <div class="btn">
          <Button color="light">starten</Button>
        </div>
      </div>
    </AccordionItem>
    <div />
    <h1 class="mt-10">Nationale Bildungsplattform</h1>
    <AccordionItem bind:open={items[1]}>
      <span slot="header">Registrieren/Anmelden bei der NBP</span>
    </AccordionItem>
    <AccordionItem bind:open={items[2]}>
      <span slot="header">Zeugnis mit der NBP teilen</span>
    </AccordionItem>
    <div />
    <h1 class="mt-10">Hochschule</h1>
    <AccordionItem bind:open={items[3]}>
      <div slot="header">Bewerbung zur Immatrikulation an einer Hochschule</div>
      <p>Something more</p>
    </AccordionItem>
  </Accordion>
</main>

<style>
  .header {
    margin-bottom: 2em;
  }

  .align-right {
    position: relative;
  }

  .btn {
    width: 20%;
    margin-left: auto;
  }
</style>
