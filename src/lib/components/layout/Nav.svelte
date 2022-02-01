<script lang="ts">
  import { routes } from '$lib/enum-types';

  export let venueId: string;
  export let activeMenu: routes;
</script>

<ul class="nav z-10 w-16 list-none border-b shadow-md">
  <li>
    <a class="block py-4 text-center" class:active={activeMenu === routes.HOME} href="/" sveltekit:prefetch>
      <span class="material-icons text-[28px] relative top-[5px] text-gray-600">chevron_left</span>
    </a>
  </li>
  <li>
    <a class="block py-4 text-center" class:active={activeMenu === routes.VENUES} href="/{routes.VENUES}/{venueId}" sveltekit:prefetch>
      <span class="material-icons text-[28px] relative top-[5px] text-gray-600">business</span>
    </a>
  </li>
  <li>
    <a
      class="block py-4 text-center"
      class:pointer-events-none={venueId === 'new'}
      class:active={activeMenu === routes.FLOORS}
      href="/{routes.VENUES}/{venueId}/{routes.FLOORS}"
      sveltekit:prefetch
    >
      <span class="material-icons text-[28px] relative top-[5px] text-gray-600">layers</span>
    </a>
  </li>
  <!-- <li>
    <a class="block py-4 text-center" href="/{routes.VENUES}/{venueId}/{routes.FLOORPLANS}" sveltekit:prefetch>
      <span class="material-icons text-[28px] relative top-[5px] text-gray-600">file_upload</span>
    </a>
  </li> -->
  <li>
    <a
      class="block py-4 text-center"
      class:pointer-events-none={venueId === 'new'}
      class:active={activeMenu === routes.PLACES}
      href="/{routes.VENUES}/{venueId}/{routes.PLACES}"
      sveltekit:prefetch
    >
      <span class="material-icons text-[28px] relative top-[5px] text-gray-600">location_on</span>
    </a>
  </li>
</ul>

<!-- background-image: url('/topo-lines.svg'); -->
<style lang="postcss">
  .nav {
    @apply bg-gray-800;
  }

  a.active {
    box-shadow: inset 3px 0 0 0 #4264fb;
    @apply bg-gray-700;
  }
  a.active .material-icons,
  a.active:hover .material-icons {
    @apply text-gray-200;
  }
</style>
