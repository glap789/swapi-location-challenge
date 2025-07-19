import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { z as validator } from 'zod';
import { v4 } from 'uuid';
import { authenticate } from '../middleware/auth';

const schema = validator.object({
  personaje: validator.object({
    nombre: validator.string().min(3),
  }),
  CordenadasMundo: validator.object({
    pais: validator.string()
  }),
});

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const table = process.env.CUSTOM_DATA_TABLE ?? '';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {

  const body = event.body
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ mensaje: 'Falta body en la petición' }),
    };
  }

  let parsed;
  try {
    parsed = schema.parse(JSON.parse(body));
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ mensaje: 'Error de validación de datos' }),
    };
  }

  const payload = { 
    id: v4(), 
    ...parsed,
    createdAt: new Date().toISOString(), };

  try {

    const user = authenticate(event);
    console.log('Usuario autenticado:', user);

    await ddb.send(new PutCommand({ TableName: table, Item: payload }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
  } catch (error: any) {
    console.error(error.message);
    const isUnauthorized = error.message?.startsWith('UNAUTHORIZED');
    return {
      statusCode: isUnauthorized ? 401 : 500,
      body: JSON.stringify({
        mensaje: isUnauthorized
          ? 'No autorizado: token inválido o ausente'
          : 'Problemas con apis internas, volver a intentar',
      }),
    };
  }
};
