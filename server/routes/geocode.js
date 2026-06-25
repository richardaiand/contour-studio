import { geocodeAddress, autocompleteAddress, reverseGeocode, computeBounds } from '../services/geocode.js';

export default async function (fastify) {
  fastify.get('/autocomplete', {
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (req) => {
    const results = await autocompleteAddress(req.query.q);
    return { results };
  });

  fastify.get('/reverse', {
    schema: {
      querystring: {
        type: 'object',
        required: ['lat', 'lon'],
        properties: {
          lat: { type: 'number' },
          lon: { type: 'number' },
        },
      },
    },
  }, async (req) => {
    return reverseGeocode(req.query.lat, req.query.lon);
  });

  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string', minLength: 1 },
          sizeMeters: { type: 'number', minimum: 100, maximum: 10000 },
          lat: { type: 'number' },
          lon: { type: 'number' },
          bbox: { type: 'array', items: { type: 'number' } },
        },
      },
    },
  }, async (req) => {
    const { address, sizeMeters = 1000, lat, lon, bbox } = req.body;

    // If autocomplete already provided coordinates, skip the external geocode call.
    if (lat !== undefined && lon !== undefined) {
      const bounds = bbox?.length === 4
        ? { minLon: bbox[0], minLat: bbox[1], maxLon: bbox[2], maxLat: bbox[3] }
        : computeBounds({ lat, lon }, sizeMeters);

      return {
        center: { lat, lon },
        displayName: address,
        bounds,
        address,
      };
    }

    const result = await geocodeAddress(address);
    const bounds = computeBounds({ lat: result.lat, lon: result.lon }, sizeMeters);

    return {
      center: { lat: result.lat, lon: result.lon },
      displayName: result.displayName,
      bounds,
      address: result.address,
    };
  });
}
