/*
  # Add product categories

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)

  2. Changes
    - Add `category_id` to `products` table

  3. Security
    - Enable RLS on `categories` table
    - Add policy for public viewing of categories
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- Insert default categories
INSERT INTO categories (name) VALUES
  ('Camisas'),
  ('Calças'),
  ('Vestidos'),
  ('Saias'),
  ('Casacos'),
  ('Calçados'),
  ('Acessórios'),
  ('Roupas Íntimas'),
  ('Roupas Esportivas'),
  ('Outros')
ON CONFLICT (name) DO NOTHING;