import { handler } from '../../src/handlers/getFusionados';
import * as apiService from '../../src/services/api.service';
import * as authMiddleware from '../../src/middleware/auth';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SwapiPerson, Cordenadas } from '../../src/models/Api';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

const ddbMock = mockClient(DynamoDBDocumentClient);

jest.mock('../../src/services/api.service');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('Prueba de integración - getFusionados con JWT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ddbMock.reset();
    process.env.FUSION_HISTORY_TABLE = 'TestFusionTable';
  });

  test('Debe autenticar, fusionar datos y guardar en DynamoDB', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    jest.spyOn(authMiddleware, 'authenticate').mockReturnValue(mockUser);

    const mockSwapi: SwapiPerson = {
      name: 'Luke Skywalker',
      height: '172',
      mass: '77',
      hair_color: 'blond',
      skin_color: 'fair',
      eye_color: 'blue',
      birth_year: '19BBY',
      gender: 'male',
    };

    const mockGeo: Cordenadas = {
      ip: '123.123.123.123',
      city: 'Lima',
      region: 'Lima',
      country: 'PE',
      latitude: '-12.0464',
      longitude: '-77.0428',
    };

    mockedApiService.getPersonajeStarWars.mockResolvedValue({
      id: 1,
      data: mockSwapi,
    });

    mockedApiService.getObtenerCordenadas.mockResolvedValue({
      id: mockGeo.ip,
      data: mockGeo,
    });

    ddbMock.on(PutCommand).resolves({});

    const event = {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzdWFyaW8xMjMiLCJlbWFpbCI6InVzdWFyaW9AZWplbXBsby5jb20ifQ.YgYST3Qin6d0pKvoAD3orS5sBfjD4yZCimsjU2OxLIg',
      },
    } as unknown as APIGatewayProxyEventV2;

    const result = await handler(event, {} as Context, () => {}) as {
      statusCode: number;
      body: string;
    };

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(mockedApiService.getPersonajeStarWars).toHaveBeenCalledTimes(1);
    expect(mockedApiService.getObtenerCordenadas).toHaveBeenCalledTimes(1);
    expect(ddbMock.commandCalls(PutCommand).length).toBe(1);

    expect(body).toEqual({
      swapiId: 1,
      CordenadasId: '123.123.123.123',
      personaje: {
        nombre: 'Luke Skywalker',
        altura: '172',
        peso: '77',
        color_cabello: 'blond',
        color_piel: 'fair',
        color_ojos: 'blue',
        nacimiento: '19BBY',
        genero: 'male',
      },
      CordenadasMundo: {
        ip: '123.123.123.123',
        pais: 'PE',
        region: 'Lima',
        ciudad: 'Lima',
        latitud: '-12.0464',
        longitud: '-77.0428',
      },
    });
  });
});
