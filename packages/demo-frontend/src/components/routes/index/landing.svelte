<script lang="ts">
  import {
    Alert,
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
  import { siteConfig, userInfo } from "../../../store";
</script>

<Container>
  <h1 class="display-1">Hello {$userInfo.given_name ? $userInfo.given_name : $userInfo.preferred_username}</h1>
  <div>
    {#if !$userInfo.attributes?.enmeshedAddress}
      <Alert color="warning" dismissible fade={false}
        >It seems that you have not connected your account to Enmeshed yet. You can do that in the profile page. You can
        get there by clicking <mark><a href="#/profile/onboarding">here</a></mark> or by navigating there using the navbar.</Alert
      >
      <Container>
        <p class="lead">
          If you don't have the enmeshed app yet, you can download it for free for <code
            ><a href="https://play.google.com/store/apps/details?id=eu.enmeshed.app&hl=de&gl=US">Android</a></code
          >
          and
          <code><a href="https://apps.apple.com/us/app/enmeshed/id1576693742#?platform=ipad">IOS</a></code>.
        </p></Container
      >
    {:else}
      <Container>
        <p class="lead">Great, your account is connected to enmeshed!</p>
        <p class="lead">You can now enjoy the following benefits:</p>
        <Card class="mb-3" color="light">
          <CardHeader>
            <CardTitle class="heading">No more password!</CardTitle>
          </CardHeader>
          <CardBody>
            <CardSubtitle>No need to memorize your password!</CardSubtitle>
            <CardText>
              There is no more need to remember a password, you can now use your Enmeshed-app instead to login or make
              changes to your <a href="#/profile">account</a>!
            </CardText>
            <Button>Learn more!</Button>
          </CardBody>
          <CardFooter>Who needs a Password anyway? :)</CardFooter>
        </Card>
        <Card class="mb-3" color="light">
          <CardHeader>
            <CardTitle class="heading">Secure comunication!</CardTitle>
          </CardHeader>
          <CardBody>
            <CardSubtitle>End to end encryption</CardSubtitle>
            <CardText
              >All communication between you and the {$siteConfig.companyName} can now safely run via Enmeshed!</CardText
            >
            <Button href="https://enmeshed.eu/explore/cryptography" style="color:white">Learn more!</Button>
          </CardBody>
          <CardFooter>Safety first! <Icon name="check2-all" /></CardFooter>
        </Card>
        <Card class="mb-3" color="light">
          <CardHeader>
            <CardTitle class="heading">Data Control!</CardTitle>
          </CardHeader>
          <CardBody>
            <CardSubtitle>Take control of the data you share!</CardSubtitle>
            <CardText
              >You can, at any time, check what data you have shared with {$siteConfig.companyName} in your Enmeshed-app!</CardText
            >
            <Button>Learn more!</Button>
          </CardBody>
          <CardFooter>You are the master of your Data! <Icon name="emoji-sunglasses" /></CardFooter>
        </Card>
      </Container>
    {/if}
  </div></Container
>

<style>
  code:hover {
    cursor: pointer;
  }
  mark:hover {
    cursor: pointer;
  }
  div {
    text-align: left;
  }
  a {
    text-decoration: none;
    color: inherit;
  }
  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-weight: 100;
  }
</style>
