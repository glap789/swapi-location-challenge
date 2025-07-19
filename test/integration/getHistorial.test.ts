import { handler } from '../../src/handlers/getHistorial';
import * as authMiddleware from '../../src/middleware/auth';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Prueba de Integración para getHistorial con autenticación', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
    process.env.FUSION_HISTORY_TABLE = 'TestFusionTable';
  });

  test('Debe autenticar, consultar historial y devolver datos con paginación', async () => {
    const mockItems = [{ id: '123', fechaCreacion: new Date().toISOString() }];
    const mockLastKey = { id: 'abc', recordType: 'FUSION_HISTORY' };

    jest.spyOn(authMiddleware, 'authenticate').mockReturnValue({
      id: 'user123',
      email: 'test@example.com',
    });

    ddbMock.on(QueryCommand).resolves({
      Items: mockItems,
      LastEvaluatedKey: mockLastKey,
    });

    const event = {
      headers: {
        Authorization: 'Bearer token123',
      },
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEventV2;

    const result = await handler(event, {} as Context, () => {}) as {
      statusCode: number;
      body: string;
    };

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toEqual(mockItems);
    expect(body.nextToken).toBeDefined();
    expect(typeof body.nextToken).toBe('string');
  });

  test('Debe autenticar y devolver historial sin nextToken si no hay paginación', async () => {
    jest.spyOn(authMiddleware, 'authenticate').mockReturnValue({
      id: 'user123',
      email: 'test@example.com',
    });

    const mockItems = [{ id: '999', fechaCreacion: new Date().toISOString() }];
    ddbMock.on(QueryCommand).resolves({
      Items: mockItems,
    });

    const event = {
      headers: {
        Authorization: 'Bearer tokenXYZ',
      },
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEventV2;

    const result = await handler(event, {} as Context, () => {}) as {
      statusCode: number;
      body: string;
    };

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toEqual(mockItems);
    expect(body.nextToken).toBeNull();
  });

  test('Debe manejar errores de DynamoDB', async () => {
    jest.spyOn(authMiddleware, 'authenticate').mockReturnValue({
      id: 'user123',
      email: 'test@example.com',
    });

    ddbMock.on(QueryCommand).rejects(new Error('DynamoDB error'));

    const event = {
      headers: {
        Authorization: 'Bearer tokenError',
      },
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEventV2;

    const result = await handler(event, {} as Context, () => {}) as {
      statusCode: number;
      body: string;
    };

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(500);
    expect(body.mensaje).toBe('Error al guardar en base de datos');
  });

  test('Debe devolver 401 si el token es inválido o ausente', async () => {
    jest.spyOn(authMiddleware, 'authenticate').mockImplementation(() => {
      throw new Error('UNAUTHORIZED: token inválido');
    });

    const event = {
      headers: {
        Authorization: 'Bearer tokenInvalido',
      },
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEventV2;

    const result = await handler(event, {} as Context, () => {}) as {
      statusCode: number;
      body: string;
    };

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(401);
    expect(body.mensaje).toBe('No autorizado: token inválido o ausente');
  });
});
