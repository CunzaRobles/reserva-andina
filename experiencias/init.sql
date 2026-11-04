CREATE TABLE experiencias (
  id SERIAL PRIMARY KEY,
  anfitrion_id INTEGER NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  capacidad INTEGER NOT NULL
);

-- Datos de prueba (anfitrion_id corresponde a los anfitriones 1, 2 y 3)
INSERT INTO experiencias (anfitrion_id, titulo, tipo, precio, capacidad) VALUES
(1, 'Taller de tejido tradicional', 'taller', 60.00, 10),
(2, 'Pachamanca en familia', 'gastronomia', 80.00, 12),
(3, 'Hospedaje vivencial', 'hospedaje', 120.00, 4);
