import jwt from 'jsonwebtoken';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export function authenticate(event: APIGatewayProxyEventV2): AuthenticatedUser {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token no proporcionado');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    return decoded;
  } catch (err) {
    throw new Error('UNAUTHORIZED');
  }
}
