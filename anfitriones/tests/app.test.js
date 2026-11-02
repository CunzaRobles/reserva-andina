const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

afterAll(async () => {
  await pool.end();
});

test('GET /health responde que el servicio está activo', async () => {
  const response = await request(app).get('/health');
  expect(response.statusCode).toBe(200);
  expect(response.body.servicio).toBe('anfitriones');
});

test('GET /anfitriones devuelve la lista de anfitriones', async () => {
  const response = await request(app).get('/anfitriones');
  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBeGreaterThan(0);
});

test('GET /anfitriones/1 devuelve un anfitrión existente', async () => {
  const response = await request(app).get('/anfitriones/1');
  expect(response.statusCode).toBe(200);
  expect(response.body.id).toBe(1);
});

test('GET /anfitriones/9999 responde 404 si no existe', async () => {
  const response = await request(app).get('/anfitriones/9999');
  expect(response.statusCode).toBe(404);
  expect(response.body.error).toBe('Anfitrión no encontrado');
});

test('POST /anfitriones rechaza un registro sin teléfono', async () => {
  const response = await request(app)
    .post('/anfitriones')
    .send({ nombre: 'Familia Prueba', comunidad: 'Pisac' });
  expect(response.statusCode).toBe(400);
});

test('POST /anfitriones registra un anfitrión válido', async () => {
  const response = await request(app)
    .post('/anfitriones')
    .send({ nombre: 'Familia Prueba', comunidad: 'Pisac', telefono: '+51900000099' });
  expect(response.statusCode).toBe(201);
  expect(response.body.id).toBeDefined();
  await pool.query('DELETE FROM anfitriones WHERE id = $1', [response.body.id]);
});
