-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table users (
  id uuid default uuid_generate_v4() primary key,
  name text,
  email text unique not null,
  password text not null,
  phone text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Products Table
create table products (
  id bigint primary key, -- Keeping standard ID to match frontend logic
  name text not null,
  price numeric not null,
  "originalPrice" numeric,
  "salePrice" numeric,
  "offerType" text,
  category text default 'featured',
  image text,
  description text,
  rating numeric,
  reviews numeric,
  specs text[], 
  ingredients text[],
  uses text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Invoices Table
create table invoices (
  _id uuid default uuid_generate_v4() primary key,
  "invoiceNo" text,
  "customerName" text,
  "customerPhone" text,
  "shippingAddress" text,
  "billingAddress" text,
  "selectedProductId" bigint references products(id),
  "productName" text,
  price numeric,
  quantity numeric,
  "shippingCharge" numeric,
  "discountAmount" numeric,
  total numeric,
  "paymentMode" text,
  "welcomeNote" text,
  "fromAddress" text,
  date timestamp with time zone default timezone('utc'::text, now())
);

-- Coupons Table
create table coupons (
  _id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  "discountType" text, -- 'percentage' or 'flat'
  "discountValue" numeric,
  "minPurchase" numeric,
  "isActive" boolean default true
);
