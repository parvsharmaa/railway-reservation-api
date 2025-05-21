-- Create berths table
CREATE TABLE IF NOT EXISTS berths (
  id SERIAL PRIMARY KEY,
  coach_number VARCHAR(10) NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('LOWER', 'UPPER', 'MIDDLE', 'SIDE_LOWER')),
  is_allocated BOOLEAN DEFAULT false,
  UNIQUE (coach_number, seat_number)
);

-- Insert sample data (63 confirmed + 9 RAC berths)
INSERT INTO berths (coach_number, seat_number, type)
SELECT 
  CASE WHEN i <= 63 THEN 'A'||ceil(i/21.0) ELSE 'R'||ceil((i-63)/3.0) END,
  CASE WHEN i <= 63 THEN LPAD(i::text, 2, '0') ELSE 'R'||(i-63) END,
  CASE 
    WHEN i <= 63 THEN 
      CASE i%3 WHEN 1 THEN 'LOWER' WHEN 2 THEN 'MIDDLE' ELSE 'UPPER' END
    ELSE 'SIDE_LOWER'
  END
FROM generate_series(1, 72) AS i;