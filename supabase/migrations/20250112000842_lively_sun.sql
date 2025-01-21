/*
  # Add user roles and ratings

  1. Changes
    - Add role column to profiles table
    - Add vendor details columns to profiles
    - Add ratings table for products
    - Update RLS policies
    - Add trigger for profile creation on signup

  2. Security
    - Enable RLS on ratings table
    - Add policies for ratings
*/

-- Add role and vendor details to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente', 'vendedor')),
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS identity_number text,
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Create ratings table
CREATE TABLE IF NOT EXISTS product_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS on ratings
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION calculate_average_rating(product_id uuid)
RETURNS numeric AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating)::numeric(10,2), 0)
    FROM product_ratings
    WHERE product_id = $1
  );
END;
$$ LANGUAGE plpgsql;

-- Add average_rating column to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0;

-- Create trigger to update average rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET average_rating = calculate_average_rating(NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON product_ratings
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- Create trigger for profile creation on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update products policy to check for vendor role
DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Only vendors can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'vendedor'
    )
  );

-- Ratings policies
CREATE POLICY "Anyone can view ratings"
  ON product_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated clients can insert ratings"
  ON product_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'cliente'
    )
  );

CREATE POLICY "Users can update own ratings"
  ON product_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON product_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);