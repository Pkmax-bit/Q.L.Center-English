-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'teacher', 'student')),
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subjects (Môn học)
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Facilities (Cơ sở/Phòng học) - created BEFORE schedules
create table public.facilities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text default 'classroom' check (type in ('campus', 'building', 'classroom', 'lab', 'office')),
  parent_id uuid references public.facilities(id),
  capacity integer,
  equipment text,
  status text default 'available' check (status in ('available', 'occupied', 'maintenance')),
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Classes (Lớp học)
create table public.classes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  subject_id uuid references public.subjects(id),
  teacher_id uuid references public.profiles(id),
  description text,
  max_students integer default 30,
  status text default 'active' check (status in ('active', 'inactive', 'completed')),
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Class Students (junction)
create table public.class_students (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references public.classes(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  enrolled_at timestamptz default now(),
  status text default 'active' check (status in ('active', 'dropped', 'completed')),
  unique(class_id, student_id)
);

-- Lessons (Bài học)
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references public.classes(id) on delete cascade,
  title text not null,
  content text,
  content_type text default 'text' check (content_type in ('text', 'file', 'youtube', 'drive', 'mixed')),
  file_url text,
  youtube_url text,
  drive_url text,
  order_index integer default 0,
  is_published boolean default false,
  is_template boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assignments (Bài tập)
create table public.assignments (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references public.classes(id) on delete cascade,
  lesson_id uuid references public.lessons(id),
  title text not null,
  description text,
  assignment_type text default 'mixed' check (assignment_type in ('mcq', 'essay', 'mixed')),
  due_date timestamptz,
  total_points integer default 100,
  is_published boolean default false,
  is_template boolean default false,
  time_limit_minutes integer,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assignment Questions
create table public.assignment_questions (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('mcq', 'essay')),
  options jsonb,
  correct_answer text,
  points integer default 10,
  order_index integer default 0,
  file_url text,
  youtube_url text,
  created_at timestamptz default now()
);

-- Submissions (Bài nộp)
create table public.submissions (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  status text default 'in_progress' check (status in ('in_progress', 'submitted', 'graded')),
  score numeric,
  feedback text,
  submitted_at timestamptz,
  graded_at timestamptz,
  graded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Submission Answers
create table public.submission_answers (
  id uuid default uuid_generate_v4() primary key,
  submission_id uuid references public.submissions(id) on delete cascade,
  question_id uuid references public.assignment_questions(id) on delete cascade,
  answer_text text,
  selected_option_id text,
  is_correct boolean,
  points_earned numeric default 0,
  feedback text,
  created_at timestamptz default now()
);

-- Schedules (Thời khóa biểu)
create table public.schedules (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references public.classes(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room_id uuid references public.facilities(id),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Finances (Tài chính)
create table public.finances (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('income', 'expense')),
  category text not null check (category in ('tuition', 'salary', 'equipment', 'rent', 'utilities', 'other')),
  amount numeric not null,
  description text,
  reference_id uuid,
  reference_type text,
  payment_date date not null,
  payment_method text,
  status text default 'completed' check (status in ('pending', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;
alter table public.lessons enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_questions enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;
alter table public.schedules enable row level security;
alter table public.facilities enable row level security;
alter table public.finances enable row level security;

-- RLS Policies
create policy "Public profiles readable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Subjects readable by all" on public.subjects for select using (true);
create policy "Classes readable by all" on public.classes for select using (true);
create policy "Lessons readable by all" on public.lessons for select using (true);
create policy "Assignments readable by all" on public.assignments for select using (true);
create policy "Questions readable by all" on public.assignment_questions for select using (true);
create policy "Submissions by student" on public.submissions for select using (auth.uid() = student_id);
create policy "Answers by student" on public.submission_answers for select using (true);
create policy "Schedules readable" on public.schedules for select using (true);
create policy "Facilities readable" on public.facilities for select using (true);
create policy "Finances admin only" on public.finances for select using (true);
create policy "Class students readable" on public.class_students for select using (true);

-- Permissive policies for admin (via service role in API routes)
create policy "Admin full access profiles" on public.profiles for all using (true);
create policy "Admin full access subjects" on public.subjects for all using (true);
create policy "Admin full access classes" on public.classes for all using (true);
create policy "Admin full access class_students" on public.class_students for all using (true);
create policy "Admin full access lessons" on public.lessons for all using (true);
create policy "Admin full access assignments" on public.assignments for all using (true);
create policy "Admin full access questions" on public.assignment_questions for all using (true);
create policy "Admin full access submissions" on public.submissions for all using (true);
create policy "Admin full access answers" on public.submission_answers for all using (true);
create policy "Admin full access schedules" on public.schedules for all using (true);
create policy "Admin full access facilities" on public.facilities for all using (true);
create policy "Admin full access finances" on public.finances for all using (true);
