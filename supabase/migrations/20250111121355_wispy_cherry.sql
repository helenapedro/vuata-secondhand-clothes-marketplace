/*
  # Add product media support and cart functionality

  1. New Tables
    - `product_media` - Stores multiple images and video URLs for products
    - `cart_items` - Stores items in user's shopping cart
  
  2. Changes
    - Add support for multiple product images and videos
    - Add shopping cart functionality
    
  3. Security
    - Enable RLS on new tables
    - Add policies for cart management
*/

-- Create product media table
CREATE TABLE IF NOT EXISTS product_media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create shopping cart table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Product media policies
CREATE POLICY "Anyone can view product media"
  ON product_media FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own product media"
  ON product_media FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id AND seller_id = auth.uid()
  ));

CREATE POLICY "Users can update own product media"
  ON product_media FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id AND seller_id = auth.uid()
  ));

CREATE POLICY "Users can delete own product media"
  ON product_media FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id AND seller_id = auth.uid()
  ));

-- Cart policies
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);