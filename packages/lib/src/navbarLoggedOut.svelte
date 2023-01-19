<script lang="ts">
  import { location, querystring } from "svelte-spa-router";
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
  import { validate } from "./functions.svelte";
  import { NavbarTypes, SiteConfig } from "./types.svelte";
  export let siteConfig: Writable<SiteConfig>;
  export let color = "light" as Color;
  let isOpen = false;
</script>

<Navbar
  {color}
  dark={color === "dark" || color === "primary"}
  light={color !== "dark" && color !== "primary"}
  expand="xl"
  sticky="top"
>
  <NavbarBrand href="#/">{$siteConfig.companyName}</NavbarBrand>
  <NavbarToggler on:click={() => (isOpen = !isOpen)} />

  <Collapse {isOpen} navbar={true} expand="xl">
    <Nav class="ms-auto" navbar tabs={true}>
      {#each $siteConfig.open as item}
        {#if validate(item) === NavbarTypes.Link}
          <NavItem>
            <NavLink
              href={item.link}
              class={item.link.includes($location) && $location !== "/" ? "active" : ""}
              disabled={item.active}
              ><Icon name={item.icon} />
              {item.name}</NavLink
            >
          </NavItem>
        {:else if "routes" in item}
          <Dropdown nav inNavbar>
            <DropdownToggle
              nav
              caret
              class={Array.from(item.routes).some((el) => el.link.includes($location) && $location !== "/")
                ? "active"
                : ""}><Icon name={item.icon} /> {item.name}</DropdownToggle
            >
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

      <NavItem>
        <NavLink
          style={color === "light" ? "color:#707071" : ""}
          href={`#/login${$querystring ? `?${$querystring}` : ""}`}
          class={$location === "/login" ? "active" : ""}>Login</NavLink
        >
      </NavItem>
      {#if $siteConfig.registration}
        <NavItem>
          <NavLink
            style="color:#707071"
            href={`#/register${$querystring ? `?${$querystring}` : ""}`}
            class={$location === "/register" ? "active" : ""}>Register</NavLink
          >
        </NavItem>
      {/if}
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
