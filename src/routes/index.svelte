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

  import cookie from 'cookie';
  import Map from '$lib/maps/Map.svelte';
  // import MapMarker from '$lib/maps/MapMarker.svelte';
  import { onMount } from 'svelte';
  import type { GeoRefData } from '$lib/maps/georeference';

  export let signedUrl: string;
  export let fileUrl: string;

  let loam: any;
  let map: Map;
  let imageInput: HTMLInputElement;
  let loadingMessage = '';

  let upperLeftX;
  let upperLeftY;
  let lowerRightX;
  let lowerRightY;

  let geoRefData: GeoRefData = {
    points: [
      {
        x: 0,
        y: 0,
        // SW
        longitude: 0,
        latitude: 0,
      },
      {
        x: 600,
        y: 400,
        // NE
        longitude: 6,
        latitude: 4,
      },
    ],
    bbox: [0, 0, 600, 400],
  };

  let error: string;
  let uploadedImage: File;

  // let geoData = { width: 0, height: 0, count: 0, wkt: '', geoTransform: [0, 0, 0, 0, 0, 0], coordinaties: '' };

  // const EPSG3857 =
  //   'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';

  onMount(async () => {
    loam = await import('loam');
    loam.initialize(window.location.origin);
  });

  function onImageSelected(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    uploadedImage = event.currentTarget.files[0];

    let reader = new FileReader();
    reader.readAsDataURL(uploadedImage);
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const image = new Image();
      image.src = event.target.result as string;
      image.onload = () => {
        const imageDataUrl = event.target.result as string;
        addImageLayer('image', imageDataUrl, geoRefData);
      };
    };
  }

  async function onConvertToGeotiffSelected() {
    loadingMessage = 'Converting to GeoTIFF...';

    const file = await loam.open(uploadedImage);

    const warpedDataset = await file.convert([
      '-of',
      'GTiff',
      '-outsize',
      '600',
      '400',
      '-a_srs',
      'EPSG:3857',
      '-a_ullr',
      upperLeftX,
      upperLeftY,
      lowerRightX,
      lowerRightY,
    ]);
    // const warpedDataset = await dataset.warp(['-tr', '1.0', '-1.0', '-r', 'bilinear']); // EPSG:4326

    const bla = await warpedDataset.transform();
    console.log(bla);
    console.log(`${upperLeftX} ${upperLeftY} ${lowerRightX} ${lowerRightY}`);

    const fileBytes: Uint16Array = await warpedDataset.bytes();
    const filename = warpedDataset.source.src.name.split('.')[0] + '.tiff';
    const geotiffFile = new File([fileBytes], filename, { type: 'image/tiff' });
    await Promise.all([
      // printGeoTiffValues(warpedDataset),
      uploadGeotiff(geotiffFile),
    ]);
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

  // async function printGeoTiffValues(dataset: any) {
  //   const [width, height, count, wkt, geoTransform] = await Promise.all([
  //     dataset.width(),
  //     dataset.height(),
  //     dataset.count(),
  //     dataset.wkt(),
  //     dataset.transform(),
  //   ]);
  //   geoData.width = width;
  //   geoData.height = height;
  //   geoData.count = count;
  //   geoData.wkt = wkt;

  //   const cornersPx = [
  //     [0, 0],
  //     [width, 0],
  //     [width, height],
  //     [0, height],
  //   ];

  //   // https://gdal.org/user/raster_data_model.html#affine-geotransform
  //   const cornersGeo = cornersPx.map(([x, y]) => {
  //     return [geoTransform[0] + geoTransform[1] * x + geoTransform[2] * y, geoTransform[3] + geoTransform[4] * x + geoTransform[5] * y];
  //   });

  //   const cornersLngLat = await loam.reproject(wkt, EPSG3857, cornersGeo);
  //   cornersLngLat.forEach(([lng, lat], i: number) => {
  //     geoData.coordinaties +=
  //       '(' + cornersGeo[i][0].toString() + ', ' + cornersGeo[i][1].toString() + ') (' + lng.toString() + ', ' + lat.toString() + ')\n';
  //   });
  // }

  function addImageLayer(id: string, imageDataUrl: string, geoRefData: GeoRefData) {
    const posInfo = map.getPositionInfo(geoRefData);
    upperLeftX = posInfo[0][0].toString();
    upperLeftY = posInfo[0][1].toString();
    lowerRightX = posInfo[2][0].toString();
    lowerRightY = posInfo[2][1].toString();

    map.addLayer(
      id,
      {
        type: 'image',
        url: `${imageDataUrl}`,
        coordinates: map.getPositionInfo(geoRefData),
      },
      { id, type: 'raster', source: id, paint: { 'raster-fade-duration': 0 } },
    );

    map.dragImage(id, id, geoRefData);
  }

  function getCustomImageTileset(tileset: string): void {
    map.addLayer(tileset, { type: 'raster', url: `mapbox://${tileset}` }, { id: tileset, type: 'raster', source: tileset });
    map.goToLocation([+upperLeftX, +upperLeftY], false, 7.12);
  }

  function getLatestTileset() {
    const cookies = cookie.parse(document.cookie || '');
    if (cookies.tileset) {
      getCustomImageTileset(cookies.tileset);
    }
  }
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<div class="flex gap-4 p-4">
  <div>
    <h1 class="text-4xl">Maps</h1>
    <button on:click={getLatestTileset} type="button" class="p-1 bg-gray-300 border rounded-md">Get latest tileset</button>
    <button on:click={() => imageInput.click()} type="button" class="p-1 bg-gray-300 border rounded-md">Upload Image</button>
    <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={e => onImageSelected(e)} bind:this={imageInput} />
  </div>

  <div class="flex flex-col items-center justify-center p-1 border cursor-pointer w-max">
    <button on:click={() => onConvertToGeotiffSelected()} type="button" class="p-1 bg-gray-300 border rounded-md">Convert image to Geotiff</button>
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
      <input type="text" class="p-1 border mt-1" bind:value={lowerRightX} />
    </label>
    <label>
      image lowerRightY
      <input type="text" class="p-1 border mt-1" bind:value={lowerRightY} />
    </label>
  </div>

  {#if loadingMessage}
    <p>{loadingMessage}</p>
  {/if}
  {#if error}
    <p>error processing image: {error}</p>
  {/if}
</div>

<Map lat={35} lon={-84} zoom={3.5} bind:this={map} bind:upperLeftX bind:upperLeftY bind:lowerRightX bind:lowerRightY>
  <!-- <MapMarker lat={37.8225} lon={-122.0024} label="Svelte Body Shaping" />
  <MapMarker lat={29.723} lon={-95.4189} label="Svelte Waxing Studio" />
  <MapMarker lat={28.3378} lon={-81.3966} label="Svelte 30 Nutritional Consultants" />
  <MapMarker lat={40.6483} lon={-74.0237} label="Svelte Brands LLC" />
  <MapMarker lat={40.6986} lon={-74.41} label="Svelte Medical Systems" /> -->
</Map>
