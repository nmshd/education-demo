<script lang="ts">
  import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardSubtitle,
    CardText,
    CardTitle,
    Container,
    Icon
  } from "sveltestrap";
  import type { EnmeshedIntro, Info } from "./onboarding";

  export let enmeshedInfo: EnmeshedIntro;
  export let information: Info[];

  console.log(enmeshedInfo);
</script>

<Container sm style="padding-top: 2.5vh">
  <Card class="mb-3" color="info">
    <CardHeader>
      <CardTitle>{enmeshedInfo.title}</CardTitle>
    </CardHeader>
    <CardBody>
      <CardText>
        {enmeshedInfo.body}
      </CardText>
      <Button href={enmeshedInfo.button.link} color="light" style="color:black">{enmeshedInfo.button.text}</Button>
    </CardBody>
  </Card>

  <p class="lead">{enmeshedInfo.onboardingIntro}</p>

  {#each information as info}
    <Card class="mb-3" color="light">
      <CardHeader>
        <CardTitle class="heading">{@html info.title}</CardTitle>
      </CardHeader>
      <CardBody>
        <CardSubtitle>{@html info.body.subtitle}</CardSubtitle>
        <CardText>
          {@html info.body.content}
        </CardText>
        {#if info.button}
          <Button href={info.button.link} style="color:white; text-decoration:none">{@html info.button.text}</Button>
        {/if}
      </CardBody>
      {#if info.footer}
        <CardFooter
          >{info.footer.text}
          {#if info.footer.icon}<Icon name={info.footer.icon} />{/if}</CardFooter
        >
      {/if}
    </Card>
  {/each}
</Container>

<style>
</style>
