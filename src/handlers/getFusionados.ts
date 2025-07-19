import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as generateId } from 'uuid';
import { getPersonajeStarWars, getObtenerCordenadas } from '../services/api.service';
import { PersonajeLocalizado,  } from '../models/Mapeo';
import { authenticate } from '../middleware/auth';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.FUSION_HISTORY_TABLE ?? '';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {

  try {

    const user = authenticate(event);
    console.log('Usuario autenticado:', user);

    const [persona, ubicacion] = await Promise.all([
      getPersonajeStarWars(),
      getObtenerCordenadas(),
    ]);

    const fusionado: Omit<PersonajeLocalizado, 'id' | 'recordType' | 'fechaCreacion'> = {
      swapiId: persona.id,
      CordenadasId: ubicacion.id,
      personaje: {
        nombre: persona.data.name,
        altura: persona.data.height,
        peso: persona.data.mass,
        color_cabello: persona.data.hair_color,
        color_piel: persona.data.skin_color,
        color_ojos: persona.data.eye_color,
        nacimiento: persona.data.birth_year,
        genero: persona.data.gender,
      },
      CordenadasMundo: {
        ip: ubicacion.data.ip,
        pais: ubicacion.data.country,
        region: ubicacion.data.region,
        ciudad: ubicacion.data.city,
        latitud: ubicacion.data.latitude,
        longitud: ubicacion.data.longitude,
      },
    };

    const item: PersonajeLocalizado = {
      id: generateId(),
      recordType: 'FUSION_HISTORY',
      fechaCreacion: new Date().toISOString(),
      ...fusionado,
    };

    await dynamo.send(new PutCommand({ TableName: tableName, Item: item }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fusionado),
    };
  } catch (error: any) {
    console.error(error.message);
    const isUnauthorized = error.message?.startsWith('UNAUTHORIZED');
    return {
      statusCode: isUnauthorized ? 401 : 500,
      body: JSON.stringify({
        mensaje: isUnauthorized
          ? 'No autorizado: token inválido o ausente'
          : 'Error al guardar en base de datos',
      }),
    };
  }
};
