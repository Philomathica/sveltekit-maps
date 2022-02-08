<script lang="ts">
  import Nav from '$lib/components/layout/Nav.svelte';
  import { routes } from '$lib/enum-types';
  import { page } from '$app/stores';

  export let activeMenu: routes;

  $: setActiveMenu($page.url.pathname);

  function setActiveMenu(pathName: string) {
    activeMenu = pathName.includes(routes.PLACES)
      ? routes.PLACES
      : pathName.includes(routes.FLOORPLANS)
      ? routes.FLOORPLANS
      : pathName.includes(routes.FLOORS)
      ? routes.FLOORS
      : pathName.includes(routes.VENUES)
      ? routes.VENUES
      : routes.HOME;
  }
</script>

<div class="flex w-full h-full">
  <div class="flex flex-1">
    <Nav venueId={$page.params.venueId} {activeMenu} />
    <slot />
  </div>
</div>
