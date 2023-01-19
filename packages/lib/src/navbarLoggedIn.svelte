<script lang="ts">
  import type { Writable } from "svelte/store";
  import {
    Collapse,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Icon,
    Nav,
    Navbar,
    NavbarBrand,
    NavbarToggler,
    NavItem,
    NavLink
  } from "sveltestrap";
  import type { Color } from "sveltestrap/src/shared";
  import { logout, validate } from "./functions.svelte";
  import type { Route } from "./navbarLoggedIn";
  import { NavbarTypes, SiteConfig } from "./types.svelte";
  export let siteConfig: Writable<SiteConfig>;

  const main: (Route | Dropdown)[] = $siteConfig.open;
  const profile: Route[] = $siteConfig.profile;
  export let userName: string;
  export let color = "light" as Color;
  let isOpen = false;

  function handleUpdate(event: any) {
    isOpen = event.detail.isOpen;
  }
</script>

<Navbar
  {color}
  dark={color === "dark" || color === "primary"}
  light={color !== "dark" && color !== "primary"}
  expand="md"
>
  <NavbarBrand href="#/">{$siteConfig.companyName}</NavbarBrand>
  <NavbarToggler on:click={() => (isOpen = !isOpen)} />
  <Collapse {isOpen} navbar expand="md" on:update={handleUpdate}>
    <Nav class="ms-auto" navbar>
      {#each main as item}
        {#if validate(item) === NavbarTypes.Link}
          <NavItem>
            <NavLink href={item.link}><Icon name={item.icon} /> {item.name}</NavLink>
          </NavItem>
        {:else if "routes" in item}
          <Dropdown nav inNavbar>
            <DropdownToggle nav caret><Icon name={item.icon} /> {item.name}</DropdownToggle>
            <DropdownMenu end>
              {#each item.routes as route}
                {#if validate(route) === NavbarTypes.Link}
                  <a class="btn {route.active ? '' : 'disabled'}" href={route.link}
                    ><DropdownItem
                      >{#if route.icon}<Icon name={route.icon} />{/if}
                      {route.name}</DropdownItem
                    ></a
                  >
                {/if}
              {/each}
            </DropdownMenu>
          </Dropdown>
        {/if}
      {/each}
      <Dropdown nav inNavbar>
        <DropdownToggle nav caret><Icon name="gear" /> {userName}</DropdownToggle>
        <DropdownMenu end>
          {#each profile as item}
            {#if validate(item) === NavbarTypes.Link}
              <a class={item.active ? "" : "disabled"} href={item.link}
                ><DropdownItem
                  >{#if item.icon}<Icon name={item.icon} />{/if}
                  {item.name}</DropdownItem
                ></a
              >
            {/if}
          {/each}
          <DropdownItem divider />
          <DropdownItem on:click={logout}><Icon name="box-arrow-left" /> Logout</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </Nav>
  </Collapse>
</Navbar>

<style>
  .btn {
    text-align: left;
    padding: 0;
  }
  a {
    text-decoration: none !important;
    color: inherit;
    width: 100%;
    height: 100%;
  }
  a:hover {
    color: inherit;
  }
</style>
