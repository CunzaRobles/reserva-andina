CREATE TABLE anfitriones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  comunidad VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  idiomas VARCHAR(100) NOT NULL DEFAULT 'quechua, español'
);

INSERT INTO anfitriones (nombre, comunidad, telefono, idiomas) VALUES
('Familia Quispe Huamán', 'Chinchero', '+51900000001', 'quechua, español'),
('Familia Mamani Condori', 'Pisac', '+51900000002', 'quechua, español'),
('Familia Huillca Ccori', 'Huilloc - Ollantaytambo', '+51900000003', 'quechua, español, inglés');
