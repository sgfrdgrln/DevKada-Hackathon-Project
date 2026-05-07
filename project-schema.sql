create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text, -- optional (for UI)
  color text, -- optional
  created_at timestamptz default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references profiles(id) on delete cascade,
  category_id uuid references categories(id),

  amount numeric(10,2) not null,
  note text,

  transaction_date date not null,

  created_at timestamptz default now()
);

create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references profiles(id) on delete cascade,

  week_start date not null,
  week_end date not null,

  total_spent numeric(10,2),
  top_category_id uuid,
  top_category_percentage numeric(5,2),

  biggest_expense numeric(10,2),
  biggest_expense_id uuid references transactions(id),

  percent_change numeric(5,2),

  summary_text text,

  created_at timestamptz default now()
);