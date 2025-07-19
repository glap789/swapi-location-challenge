import axios from 'axios';
import { getObtenerCordenadas, getPersonajeStarWars } from '../../src/services/api.service';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Pruebas Unitarias para api.service', () => {

  beforeEach(() => {
    ddbMock.reset();
    mockedAxios.get.mockClear();
  });

  describe('getPersonajeStarWars', () => {
    
    test('Debe devolver datos desde el CACHÉ si el personaje existe (cache hit)', async () => {
        
      const cachedData = { name: 'Darth Vader' };
      ddbMock.on(GetCommand).resolves({ Item: { data: cachedData } });

      const result = await getPersonajeStarWars();

      expect(result.data).toEqual(cachedData);
      
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    test('Debe devolver datos desde la API si el personaje NO existe en caché (cache miss)', async () => {
        
      ddbMock.on(GetCommand).resolves({ Item: undefined });
      
      const apiData = { name: 'Leia Organa' };
      mockedAxios.get.mockResolvedValue({ data: apiData });
      
      ddbMock.on(PutCommand).resolves({});

      const result = await getPersonajeStarWars();

      expect(result.data).toEqual(apiData);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(ddbMock.commandCalls(PutCommand).length).toBe(1);
    });
  });

  describe('getObtenerCordenadas', () => {
    
    test('Debe devolver datos desde el CACHÉ si el ciudad existe (cache hit)', async () => {
        
      const cachedData = { name: 'Lima'  };
      ddbMock.on(GetCommand).resolves({ Item: { data: cachedData } });

      const result = await getObtenerCordenadas();

      expect(result.data).toEqual(cachedData);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    test('Debe devolver datos desde la API si la ciudad NO existe en caché (cache miss)', async () => {
        
      ddbMock.on(GetCommand).resolves({ Item: undefined });
      const apiData = { name: 'Londres'  };
      mockedAxios.get.mockResolvedValue({ data: apiData });
      ddbMock.on(PutCommand).resolves({});

      const result = await getObtenerCordenadas();

      expect(result.data).toEqual(apiData);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(ddbMock.commandCalls(PutCommand).length).toBe(1);
    });
  });

});