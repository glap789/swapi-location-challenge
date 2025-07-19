import axios from 'axios';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { SwapiPerson, Cordenadas } from '../models/Api';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const table = process.env.API_CACHE_TABLE ?? '';

type CacheResponse<T, K> = { id: K; data: T };

const withCache = async <T, K extends string | number>(
  id: K,
  prefix: string,
  loader: () => Promise<T>
): Promise<CacheResponse<T, K>> => {
  const key = `${prefix}:${id}`;

  const cached = await db.send(new GetCommand({ TableName: table, Key: { cacheKey: key } }));

  if (cached.Item) {
    return { id, data: cached.Item.data as T };
  }

  const data = await loader();
  const ttl = Math.floor(Date.now() / 1000) + 1800;

  await db.send(
    new PutCommand({
      TableName: table,
      Item: { cacheKey: key, data, expirationTime: ttl },
    })
  );

  return { id, data };
};

export const getPersonajeStarWars = async (): Promise<CacheResponse<SwapiPerson, number>> => {
  const id = Math.floor(Math.random() * 82) + 1;
  const fetch = () => axios.get(`https://swapi.py4e.com/api/people/${id}/`).then(r => r.data);
  return withCache(id, 'swapi', fetch);
};

export const getObtenerCordenadas = async (): Promise<CacheResponse<Cordenadas, string>> => {
  const ip = Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
  const fetch = () => axios.get(`https://get.geojs.io/v1/ip/geo/${ip}.json`).then(r => r.data);
  return withCache(ip, 'geo', fetch);
};
