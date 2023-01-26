<script lang="ts">
  export let index: number;
</script>

<h3 class="w3-bar-item">Inhalt</h3>
<ol>
  <li class="{index === 0 ? 'active' : ''} {index < 0 ? 'inactive' : ''} item">Zeugnis in ausgedruckter Form</li>
  <li class="{index === 1 ? 'active' : ''} {index < 1 ? 'inactive' : ''} item">Download der App</li>
  <li class="{index === 2 ? 'active' : ''} {index < 2 ? 'inactive' : ''} item">Scannen des QR-Codes</li>
  <li class="{index === 4 ? 'active' : ''} {index < 3 ? 'inactive' : ''} item">Betrachten der Ergebnisse</li>
</ol>

<style>
  * {
    text-align: left;
  }

  .item {
    margin-top: 2em;
  }

  .active {
    color: blue;
  }

  .inactive {
    color: rgb(122, 122, 122);
  }
</style>
