# SvelteKit Maps

Venues/Floors/Places app using Mapbox and loam (gdal in the browser with web worker) and custom 'indoor' image layer tilesets provided by Mapbox tiling service.

Provide a .env file in the root with the following entries:

- MAPBOX_UPLOAD_TOKEN=[mapbox-upload-token] - scope should be `uploads:read`, `uploads:write` and `tilesets:write`
- MAPBOX_USERNAME=[mapbox-username]
- VITE_MAPBOX_ACCESS_TOKEN=[public-mapbox-access-token]
- MONGODB_URI=[mongodb-uri]
