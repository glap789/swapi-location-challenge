# 🌌 SWAPI Locations challenge

Este proyecto utiliza la API pública de [SWAPI](https://swapi.dev/) (Star Wars API) para obtener información de personajes del universo de Star Wars y los enriquece con coordenadas geográficas (ciudad, país, latitud y longitud) para simular la ubicación actual de cada personaje en el mundo real. Es útil para aprender sobre integraciones REST, uso de coordenadas geográficas e implementación de arquitectura serverless moderna con AWS Lambda.

---

## 🚀 Stack Tecnológico

- **Node.js** + **TypeScript**
- **AWS Lambda** + **Serverless Framework**
- **DynamoDB** (simulado)
- **SWAPI** + **API de Geolocalización por IP**
- **Jest** (para testing)

---

## ✨ Características

- 🚀 Despliegue en AWS Lambda con Serverless Framework

- ☑️ 100% escrito en TypeScript

- ⚖️ Pruebas unitarias e integración con Jest

- 🌍 Llamadas HTTP a SWAPI y enriquecimiento con coordenadas

- 👨‍💻 Middleware de autenticación JWT

---

## 📂 Estructura del Proyecto

```bash
.
├── src/
│   ├── handlers/             # Funciones Lambda principales
│   │   ├── getFusionados.ts
│   │   ├── getHistorial.ts
│   │   └── postAlmacenar.ts
│   ├── middleware/           # Middleware de autenticación
│   ├── models/               # Interfaces TypeScript
│   └── services/             # Lógica para llamar APIs externas
├── test/
│   ├── integration/          # Pruebas de integración
│   └── unit/                 # Pruebas unitarias
├── package.json
├── README.md
├── serverless.yml
└── tsconfig.json

```

---

## ⚙️ Instalación

git clone https://github.com/glap789/swapi-location-challenge<br>
cd swapi-location-challenge<br>
npm install

---

🧪 Ejecutar Pruebas

npm run test

---

📦 Deploy

npm install<br>
serverless config credentials --provider aws --key TU_ACCESS_KEY --secret TU_SECRET_KEY<br>
<br>
serverless deploy

---

## 🧠 Endpoints Disponibles

- > TOKEN_JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzdWFyaW8xMjMiLCJlbWFpbCI6InVzdWFyaW9AZWplbXBsby5jb20ifQ.YgYST3Qin6d0pKvoAD3orS5sBfjD4yZCimsjU2OxLIg
- > API_ID: a8jjvzre8g

| Método | Endpoint                                                           | Descripción                                                           |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `GET`  | `https://{API_ID}.execute-api.us-east-1.amazonaws.com/fusionados` | Devuelve todos los personajes fusionados con coordenadas geográficas. |
| `GET`  | `https://{API_ID}.execute-api.us-east-1.amazonaws.com/historial`  | Devuelve el historial de fusiones anteriores.                         |
| `POST` | `https://{API_ID}.execute-api.us-east-1.amazonaws.com/almacenar`  | Recibe un personaje + el pais y lo almacena en el historial, en una tabla por separado.      |


✅ 1. Obtener personajes fusionados

```bash
curl -X GET https://{API_ID}.execute-api.us-east-1.amazonaws.com/fusionados \
  -H "Authorization: {TOKEN_JWT}" \
  -H "Content-Type: application/json"
```
✅ 2. Obtener historial de peticiones

```bash
curl -X GET https://{API_ID}.execute-api.us-east-1.amazonaws.com/historial \
  -H "Authorization: {TOKEN_JWT}" \
  -H "Content-Type: application/json"
```

✅ 3. Almacenar personaje fusionado

```bash
curl -X POST https://{API_ID}.execute-api.us-east-1.amazonaws.com/almacenar \
  -H "Authorization: {TOKEN_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
  "personaje": {
    "nombre": "Jar Jar Binks"
  },
  "CordenadasMundo": {
    "pais": "France"
  }
}'
```
---

## 🔐 Autenticación

Se incluye un middleware básico para validar tokens JWT en los endpoints protegidos. Puedes extenderlo según tus necesidades de seguridad.

---

## 👨‍💻 Autor

- **LinkedIn:** [Heber Abraham Poma Fernández](www.linkedin.com/in/heber-abraham-poma-fernanadez-425a43165)

---
