CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  experiencia_id INTEGER NOT NULL,
  turista_nombre VARCHAR(100) NOT NULL,
  turista_email VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL,
  personas INTEGER NOT NULL CHECK (personas > 0),
  total DECIMAL(10,2) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  creada_en TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Dato de prueba: coincide con los 2 cupos ya usados en el servicio Disponibilidad
-- (experiencia 1, fecha 2026-12-01) y con el aviso registrado en Notificaciones.
INSERT INTO reservas (experiencia_id, turista_nombre, turista_email, fecha, personas, total, estado) VALUES
(1, 'Lucía Fernández', 'lucia@correo.com', '2026-12-01', 2, 120.00, 'confirmada');
