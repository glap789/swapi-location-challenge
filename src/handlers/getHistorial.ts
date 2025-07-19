import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { authenticate } from '../middleware/auth';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const table = process.env.FUSION_HISTORY_TABLE ?? '';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {



  const queryStringParameters = event.queryStringParameters;

  const cantidad = queryStringParameters?.limit ? parseInt(queryStringParameters.limit, 10) : 10;
  const token = queryStringParameters?.nextToken;

  const input = {
    TableName: table,
    IndexName: 'ChronologicalIndex',
    KeyConditionExpression: 'recordType = :type',
    ExpressionAttributeValues: { ':type': 'FUSION_HISTORY' },
    Limit: cantidad,
    ScanIndexForward: false,
    ...(token && {
      ExclusiveStartKey: JSON.parse(Buffer.from(token, 'base64').toString('utf-8')),
    }),
  };

  try {
    const user = authenticate(event);
    console.log('Usuario autenticado:', user);

    const result = await db.send(new QueryCommand(input));
    const siguiente = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : null;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: result.Items ?? [],
        nextToken: siguiente,
      }),
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
