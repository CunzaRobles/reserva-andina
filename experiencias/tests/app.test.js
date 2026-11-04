const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

afterAll(async () => {
  await pool.end();
});

test('GET /health responde que el servicio está activo', async () => {
  const response = await request(app).get('/health');
  expect(response.statusCode).toBe(200);
  expect(response.body.servicio).toBe('experiencias');
});

test('GET /experiencias devuelve el catálogo', async () => {
  const response = await request(app).get('/experiencias');
  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBeGreaterThan(0);
});

test('GET /experiencias/9999 responde 404 si no existe', async () => {
  const response = await request(app).get('/experiencias/9999');
  expect(response.statusCode).toBe(404);
  expect(response.body.error).toBe('Experiencia no encontrada');
});

test('POST /experiencias rechaza un precio negativo', async () => {
  const response = await request(app)
    .post('/experiencias')
    .send({ anfitrion_id: 1, titulo: 'Prueba', tipo: 'taller', precio: -10, capacidad: 5 });
  expect(response.statusCode).toBe(400);
});

test('POST /experiencias rechaza un anfitrión inexistente (consulta a Anfitriones)', async () => {
  const response = await request(app)
    .post('/experiencias')
    .send({ anfitrion_id: 9999, titulo: 'Prueba', tipo: 'taller', precio: 50, capacidad: 5 });
  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe('El anfitrión indicado no existe');
});

test('POST /experiencias registra una experiencia válida', async () => {
  const response = await request(app)
    .post('/experiencias')
    .send({ anfitrion_id: 1, titulo: 'Experiencia de prueba', tipo: 'agricultura', precio: 45, capacidad: 6 });
  expect(response.statusCode).toBe(201);
  expect(response.body.id).toBeDefined();
  await pool.query('DELETE FROM experiencias WHERE id = $1', [response.body.id]);
});
