const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

afterAll(async () => {
  await pool.end();
});

test('GET /health responde que el servicio está activo', async () => {
  const response = await request(app).get('/health');
  expect(response.statusCode).toBe(200);
  expect(response.body.servicio).toBe('notificaciones');
});

test('GET /notificaciones devuelve el historial de avisos', async () => {
  const response = await request(app).get('/notificaciones');
  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBeGreaterThan(0);
});

test('POST /notificaciones registra un aviso válido', async () => {
  const response = await request(app)
    .post('/notificaciones')
    .send({ destinatario: '+51900000099', canal: 'whatsapp', mensaje: 'Mensaje de prueba' });
  expect(response.statusCode).toBe(201);
  expect(response.body.canal).toBe('whatsapp');
  await pool.query('DELETE FROM notificaciones WHERE id = $1', [response.body.id]);
});

test('POST /notificaciones usa SMS como canal por defecto', async () => {
  const response = await request(app)
    .post('/notificaciones')
    .send({ destinatario: '+51900000099', mensaje: 'Mensaje de prueba' });
  expect(response.statusCode).toBe(201);
  expect(response.body.canal).toBe('sms');
  await pool.query('DELETE FROM notificaciones WHERE id = $1', [response.body.id]);
});

test('POST /notificaciones rechaza un aviso sin destinatario', async () => {
  const response = await request(app)
    .post('/notificaciones')
    .send({ mensaje: 'Mensaje sin destinatario' });
  expect(response.statusCode).toBe(400);
});

test('POST /notificaciones rechaza un canal no permitido', async () => {
  const response = await request(app)
    .post('/notificaciones')
    .send({ destinatario: '+51900000099', canal: 'fax', mensaje: 'Prueba' });
  expect(response.statusCode).toBe(400);
});
