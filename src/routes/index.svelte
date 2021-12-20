<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ fetch }) => {
    const url = '/maps.json';
    const res: Response = await fetch(url);

    if (res.ok) {
      return { props: await res.json() };
    }

    return { status: res.status, error: new Error(`Could not load ${url}`) };
  };
</script>

<script lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */

  import Map from '$lib/maps/Map.svelte';
  import MapMarker from '$lib/maps/MapMarker.svelte';
  import { onMount } from 'svelte';

  export let signedUrl: string;
  export let fileUrl: string;

  let loam: any;
  let map: Map;
  let fileInput: HTMLInputElement;
  let imageInput: HTMLInputElement;
  let geotiffInput: HTMLInputElement;
  let loadingMessage = '';
  let upperLeftX = '-75.3';
  let upperLeftY = '5.5';
  let upperRightX = '-73.5';
  let upperRightY = '3.7';
  let error: string;

  let geoData = { width: 0, height: 0, count: 0, wkt: '', geoTransform: [0, 0, 0, 0, 0, 0], coordinaties: '' };

  const EPSG4326 =
    'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';

  onMount(async () => {
    loam = await import('loam');
    loam.initialize(window.location.origin);
  });

  function getCustomImageTileset(tileset: string): void {
    map.addLayer(tileset, { type: 'raster', url: `mapbox://${tileset}?fresh=true}` }, { id: 'image-layer', type: 'raster', source: tileset });
    map.goToLocation([-74.4, 4.601], false, 7.12);
  }

  async function onConvertToGeotiffSelected(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    loadingMessage = 'Converting to GeoTIFF...';
    const file = await loam.open(event.currentTarget.files[0]);
    const dataset = await file.convert(['-of', 'GTiff', '-a_srs', 'EPSG:4326', '-a_ullr', upperLeftX, upperLeftY, upperRightX, upperRightY]);

    const fileBytes: Uint16Array = await dataset.bytes();
    const filename = dataset.source.src.name.split('.')[0] + '.tiff';
    const geotiffFile = new File([fileBytes], filename, { type: 'image/tiff' });
    await Promise.all([writeToGeoTiffObject(dataset), uploadGeotiff(geotiffFile)]);
  }

  /**
   * Upload image to presigned S3 url, create image from tileset, poll status and add image layer when tileset is created.
   */
  async function uploadGeotiff(geotiffFile: File) {
    loadingMessage = 'uploading to S3...';
    error = null;

    await fetch(signedUrl, { body: geotiffFile, method: 'PUT' });

    loadingMessage = 'converting geotiff to tileset...';
    const response = await fetch('/maps.json', { body: JSON.stringify({ fileUrl, name: geotiffFile.name }), method: 'POST' });
    const { message, id } = await response.json();

    if (!response.ok) {
      error = message;
      loadingMessage = null;

      return;
    }

    const uploadResult = await getUploadResultWhenDone(id);

    if (uploadResult.error) {
      error = uploadResult.error;
      loadingMessage = null;

      return;
    }

    loadingMessage = 'done converting';
    getCustomImageTileset(uploadResult.tileset);
  }

  async function getUploadResultWhenDone(id: string) {
    const response = await fetch(`/maps/status/${id}.json`);
    const result = await response.json();

    if (result.complete || result.error) {
      return result;
    }

    // wait for 2 seconds before querying status
    await new Promise(resolve => setTimeout(resolve, 2000));

    return await getUploadResultWhenDone(id);
  }

  async function writeToGeoTiffObject(dataset: any) {
    const [width, height, count, wkt, geoTransform] = await Promise.all([
      dataset.width(),
      dataset.height(),
      dataset.count(),
      dataset.wkt(),
      dataset.transform(),
    ]);
    geoData.width = width;
    geoData.height = height;
    geoData.count = count;
    geoData.wkt = wkt;

    const cornersPx = [
      [0, 0],
      [width, 0],
      [width, height],
      [0, height],
    ];

    // https://gdal.org/user/raster_data_model.html#affine-geotransform
    const cornersGeo = cornersPx.map(([x, y]) => {
      return [geoTransform[0] + geoTransform[1] * x + geoTransform[2] * y, geoTransform[3] + geoTransform[4] * x + geoTransform[5] * y];
    });

    const cornersLngLat = await loam.reproject(wkt, EPSG4326, cornersGeo);
    cornersLngLat.forEach(([lng, lat], i: number) => {
      geoData.coordinaties +=
        '(' + cornersGeo[i][0].toString() + ', ' + cornersGeo[i][1].toString() + ') (' + lng.toString() + ', ' + lat.toString() + ')\n';
    });
  }

  function onImageSelected(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const imageFile = event.currentTarget.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const imageDataUrl = event.target.result as string;
      addImageLayer('image', imageDataUrl);
    };
  }

  function onGeotiffSelected(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const imageFile = event.currentTarget.files[0];
    let reader = new FileReader();
    reader.readAsArrayBuffer(imageFile);
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const imageArrayBuffer = event.target.result as ArrayBuffer;
      const file = await loam.open(new Blob([imageArrayBuffer], { type: 'image/tiff' }));
      const dataset = await file.convert(['-of', 'JPEG', '-scale']);
      const fileBytes: Uint16Array = await dataset.bytes();
      const blob = new Blob([fileBytes], { type: 'image/jpeg' });
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const file = event.target.result as string;
        addImageLayer('geotiff-to-image', file);
      };
      reader.readAsDataURL(blob);
    };
  }

  function addImageLayer(id: string, imageDataUrl: string) {
    map.addLayer(
      id,
      {
        type: 'image',
        url: `${imageDataUrl}?dt=${Date.now()}`,
        coordinates: [
          [-80.425, 46.437],
          [-71.516, 46.437],
          [-71.516, 37.936],
          [-80.425, 37.936],
        ],
      },
      { id: id, type: 'raster', source: id },
    );
  }
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<div class="flex gap-4 p-4">
  <div>
    <h1 class="text-4xl">Maps</h1>
    <input />
    <!-- <button class="p-1 bg-gray-300 border rounded-md" on:click={() => getCustomImageTileset('luukmoret.tileset')}>Get existing tileset</button> -->
    <!-- <button on:click={() => imageInput.click()} type="button" class="p-1 bg-gray-300 border rounded-md">Upload Image</button> -->
    <!-- <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={e => onImageSelected(e)} bind:this={imageInput} /> -->
    <!-- <button on:click={() => geotiffInput.click()} type="button" class="p-1 bg-gray-300 border rounded-md">Upload Geotiff</button> -->
    <input class="hidden" type="file" accept=".tif, .tiff" on:change={e => onGeotiffSelected(e)} bind:this={geotiffInput} />
  </div>

  <div class="flex flex-col items-center justify-center p-1 border cursor-pointer w-max">
    <button on:click={() => fileInput.click()} type="button" class="p-1 bg-gray-300 border rounded-md">Convert image to Geotiff</button>
    <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={e => onConvertToGeotiffSelected(e)} bind:this={fileInput} />
    <label>
      image upperLeftX
      <input type="text" class="p-1 border mt-1" bind:value={upperLeftX} />
    </label>
    <label>
      image upperLeftY
      <input type="text" class="p-1 border mt-1" bind:value={upperLeftY} />
    </label>
    <label>
      image lowerRightX
      <input type="text" class="p-1 border mt-1" bind:value={upperRightX} />
    </label>
    <label>
      image lowerRightY
      <input type="text" class="p-1 border mt-1" bind:value={upperRightY} />
    </label>
  </div>

  {#if loadingMessage}
    <p>{loadingMessage}</p>
  {/if}
  {#if error}
    <p>error processing image: {error}</p>
  {/if}

  <pre>
    width: {geoData.width}<br/>height: {geoData.height}<br/>band count: {geoData.count}<br/>coordinate system: {geoData.wkt}<br/>corner coordinates: <br/>{geoData.coordinaties}
  </pre>
</div>

<Map lat={35} lon={-84} zoom={3.5} bind:this={map}>
  <!-- <MapMarker lat={37.8225} lon={-122.0024} label="Svelte Body Shaping" />
  <MapMarker lat={29.723} lon={-95.4189} label="Svelte Waxing Studio" />
  <MapMarker lat={28.3378} lon={-81.3966} label="Svelte 30 Nutritional Consultants" />
  <MapMarker lat={40.6483} lon={-74.0237} label="Svelte Brands LLC" />
  <MapMarker lat={40.6986} lon={-74.41} label="Svelte Medical Systems" /> -->
</Map>
