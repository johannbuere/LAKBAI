-- Supabase Database Schema for Lakbai App
-- Run this in your Supabase SQL Editor after replacing .env credentials

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  profession TEXT,
  location TEXT,
  country TEXT,
  country_code TEXT DEFAULT 'PH',
  bio TEXT,
  favorite_itinerary_id UUID,
  profile_picture_url TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Itineraries table
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  date_from DATE,
  date_to DATE,
  emoji TEXT DEFAULT '🗺️',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Itinerary locations (POIs in an itinerary)
CREATE TABLE IF NOT EXISTS public.itinerary_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  poi_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  date DATE,
  start_time TIME,
  end_time TIME,
  transport_mode TEXT DEFAULT 'car',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_locations_itinerary_id ON public.itinerary_locations(itinerary_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for itineraries
CREATE POLICY "Users can view their own itineraries" 
  ON public.itineraries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own itineraries" 
  ON public.itineraries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries" 
  ON public.itineraries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries" 
  ON public.itineraries FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for itinerary_locations
CREATE POLICY "Users can view their own itinerary locations" 
  ON public.itinerary_locations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries 
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own itinerary locations" 
  ON public.itinerary_locations FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries 
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own itinerary locations" 
  ON public.itinerary_locations FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries 
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own itinerary locations" 
  ON public.itinerary_locations FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries 
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    location, 
    profession, 
    country, 
    country_code, 
    join_date
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'location', NULL),
    COALESCE(NEW.raw_user_meta_data->>'profession', NULL),
    COALESCE(NEW.raw_user_meta_data->>'country', 'Philippines'),
    COALESCE(NEW.raw_user_meta_data->>'country_code', 'PH'),
    CURRENT_DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS itineraries_updated_at ON public.itineraries;
CREATE TRIGGER itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Storage policy for avatars (drop existing policies first to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
