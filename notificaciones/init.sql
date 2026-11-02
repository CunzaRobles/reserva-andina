CREATE TABLE notificaciones (
  id SERIAL PRIMARY KEY,
  destinatario VARCHAR(20) NOT NULL,
  canal VARCHAR(20) NOT NULL DEFAULT 'sms',
  mensaje TEXT NOT NULL,
  enviado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Dato de prueba: aviso de la reserva de prueba del servicio Reservas
INSERT INTO notificaciones (destinatario, canal, mensaje) VALUES
('+51900000001', 'sms', 'Nueva reserva #1: Taller de tejido tradicional el 2026-12-01 para 2 persona(s).');
