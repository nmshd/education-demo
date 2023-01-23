<script lang="ts">
  export let index: number;
</script>

<h3 class="w3-bar-item">Inhalt</h3>
<ol>
  <li class="{index === 0 ? 'active' : ''} {index < 0 ? 'inactive' : ''} item">Zeugnis in ausgedruckter Form</li>
  <li class="{index === 1 ? 'active' : ''} {index < 1 ? 'inactive' : ''} item">Beigepackten QR-Code</li>
  <li class="{index === 2 ? 'active' : ''} {index < 2 ? 'inactive' : ''} item">opt. download der App</li>
  <li class="{index === 3 ? 'active' : ''} {index < 3 ? 'inactive' : ''} item">scannen des QR-Copdes</li>
  <li class="{index === 4 ? 'active' : ''} {index < 4 ? 'inactive' : ''} item">bestätigen der Eingaben</li>
  <li class="{index === 5 ? 'active' : ''} {index < 5 ? 'inactive' : ''} item">betrachten der Ergebnisse</li>
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
