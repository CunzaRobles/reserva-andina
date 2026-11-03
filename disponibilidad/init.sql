CREATE TABLE disponibilidad (
  id SERIAL PRIMARY KEY,
  experiencia_id INTEGER NOT NULL,
  fecha DATE NOT NULL,
  cupos_totales INTEGER NOT NULL CHECK (cupos_totales > 0),
  cupos_reservados INTEGER NOT NULL DEFAULT 0 CHECK (cupos_reservados >= 0),
  UNIQUE (experiencia_id, fecha)
);

-- Datos de prueba: cupos de las experiencias 1, 2 y 3 para tres fechas.
-- La experiencia 1 del 2026-12-01 ya tiene 2 cupos usados por la reserva de prueba del servicio Reservas.
INSERT INTO disponibilidad (experiencia_id, fecha, cupos_totales, cupos_reservados) VALUES
(1, '2026-12-01', 10, 2),
(1, '2026-12-02', 10, 0),
(1, '2026-12-03', 10, 0),
(2, '2026-12-01', 12, 0),
(2, '2026-12-02', 12, 0),
(2, '2026-12-03', 12, 0),
(3, '2026-12-01', 4, 0),
(3, '2026-12-02', 4, 0),
(3, '2026-12-03', 4, 0);
