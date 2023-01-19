<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";
  import { Button, Col, Container, Row } from "sveltestrap";
  let r = "";
  let d: any;
  let delRes: any;

  onMount(async () => {
    await readData();
  });

  async function sendData() {
    const json = {
      name: Math.floor(Math.random() * 10000)
    };
    const body = {
      payload: json
    };
    try {
      const res = await axios.post("api/v1/auth/genericDB", body);
      r = res.data;
      await readData();
    } catch (e) {
      console.log(e);
    }
  }

  async function readData() {
    try {
      const res = await axios.get("api/v1/auth/genericDB");
      d = res.data;
    } catch (e) {
      console.log(e);
    }
  }

  async function deleteData() {
    try {
      const res = await axios.delete("api/v1/auth/genericDB");
      delRes = res.data;
      await readData();
    } catch (e) {
      console.log(e);
    }
  }

  async function updateData() {
    try {
      const body = {
        filter: {
          name: {
            $gte: 5000
          }
        },
        data: {
          nulz: Math.random()
        }
      };
      const res = await axios.patch("api/v1/auth/genericDB", body);
      delRes = res.data;
      await readData();
    } catch (e) {
      console.log(e);
    }
  }
</script>

<Container>
  <Row cols={3}>
    <div>
      <Col>
        <Button on:click={sendData}>Write</Button>
        <br />
        <p>
          {r}
        </p>
      </Col>
    </div>
    <div>
      <Col>
        <Button on:click={updateData}>Update</Button>
        <h1>DB State</h1>
        <br />
        {#if d}
          <p>
            {JSON.stringify(d)}
          </p>
        {/if}
      </Col>
    </div>
    <div>
      <Col>
        <Button on:click={deleteData}>Delete</Button>
        <br />
        {#if delRes}
          <p>
            {JSON.stringify(delRes)}
          </p>
        {/if}
      </Col>
    </div>
  </Row>
</Container>

<style>
</style>
