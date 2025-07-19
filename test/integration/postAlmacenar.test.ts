import { handler } from '../../src/handlers/postAlmacenar';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import * as authMiddleware from '../../src/middleware/auth';

const ddbMock = mockClient(DynamoDBDocumentClient);

// Mock de authenticate
jest.mock('../../src/middleware/auth');

describe('Prueba de Integración para postAlmacenar', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.resetAllMocks();

    jest.spyOn(authMiddleware, 'authenticate').mockReturnValue({
      id: 'user123',
      email: 'user@example.com',
    });
  });

  test('Debe guardar los datos y devolver un 201 si el cuerpo es válido', async () => {
    ddbMock.on(PutCommand).resolves({});

    const validBody = {
      personaje: {
        nombre: "Luke Skywalker"
      },
      CordenadasMundo: {
        pais: "Tatooine"
      }
    };

    const event = { body: JSON.stringify(validBody) } as APIGatewayProxyEventV2;
    const context = {} as Context;
    const callback = () => {};

    const result = await handler(event, context, callback) as {
      body: string;
      statusCode: number;
    };

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(201);
    expect(body).toHaveProperty('id');
    expect(body.personaje.nombre).toBe("Luke Skywalker");
    expect(body.CordenadasMundo.pais).toBe("Tatooine");
  });

  test('Debe devolver un 400 si el cuerpo no es válido', async () => {
    const invalidBody = { personaje: { nombre: "no" } }; // min 3
    const event = { body: JSON.stringify(invalidBody) } as APIGatewayProxyEventV2;
    const context = {} as Context;
    const callback = () => {};

    const result = await handler(event, context, callback) as {
      body: string;
      statusCode: number;
    };

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body.mensaje).toBe('Error de validación de datos');
  });

  test('Debe devolver un 400 si no se envía body', async () => {
    const event = {} as APIGatewayProxyEventV2;
    const context = {} as Context;
    const callback = () => {};

    const result = await handler(event, context, callback) as {
      body: string;
      statusCode: number;
    };

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body.mensaje).toBe('Falta body en la petición');
  });

  test('Debe devolver un 500 si falla la base de datos', async () => {
    ddbMock.on(PutCommand).rejects(new Error('Fallo de DynamoDB'));

    const validBody = {
      personaje: {
        nombre: "Leia Organa"
      },
      CordenadasMundo: {
        pais: "Alderaan"
      }
    };

    const event = { body: JSON.stringify(validBody) } as APIGatewayProxyEventV2;
    const context = {} as Context;
    const callback = () => {};

    const result = await handler(event, context, callback) as {
      body: string;
      statusCode: number;
    };

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(500);
    expect(body.mensaje).toBe('Error al guardar en base de datos');
  });
});
