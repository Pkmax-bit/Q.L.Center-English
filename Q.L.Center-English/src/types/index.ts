export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  subject_id: string | null;
  teacher_id: string | null;
  description: string | null;
  max_students: number;
  status: 'active' | 'inactive' | 'completed';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  subject?: Subject;
  teacher?: Profile;
  student_count?: number;
}

export interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  status: 'active' | 'dropped' | 'completed';
  student?: Profile;
  class?: Class;
}

export interface Lesson {
  id: string;
  class_id: string | null;
  title: string;
  content: string | null;
  content_type: 'text' | 'file' | 'youtube' | 'drive' | 'mixed';
  file_url: string | null;
  youtube_url: string | null;
  drive_url: string | null;
  order_index: number;
  is_published: boolean;
  is_template: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  class?: Class;
}

export interface Assignment {
  id: string;
  class_id: string | null;
  lesson_id: string | null;
  title: string;
  description: string | null;
  assignment_type: 'mcq' | 'essay' | 'mixed';
  due_date: string | null;
  total_points: number;
  is_published: boolean;
  is_template: boolean;
  time_limit_minutes: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  class?: Class;
  questions?: AssignmentQuestion[];
}

export interface MCQOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface AssignmentQuestion {
  id: string;
  assignment_id: string;
  question_text: string;
  question_type: 'mcq' | 'essay';
  options: MCQOption[] | null;
  correct_answer: string | null;
  points: number;
  order_index: number;
  file_url: string | null;
  youtube_url: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: 'in_progress' | 'submitted' | 'graded';
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: string | null;
  created_at: string;
  assignment?: Assignment;
  student?: Profile;
  answers?: SubmissionAnswer[];
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer_text: string | null;
  selected_option_id: string | null;
  is_correct: boolean | null;
  points_earned: number;
  feedback: string | null;
  created_at: string;
  question?: AssignmentQuestion;
}

export interface Schedule {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  class?: Class;
  room?: Facility;
}

export interface Facility {
  id: string;
  name: string;
  type: 'campus' | 'building' | 'classroom' | 'lab' | 'office';
  parent_id: string | null;
  capacity: number | null;
  equipment: string | null;
  status: 'available' | 'occupied' | 'maintenance';
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Finance {
  id: string;
  type: 'income' | 'expense';
  category: 'tuition' | 'salary' | 'equipment' | 'rent' | 'utilities' | 'other';
  amount: number;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  payment_date: string;
  payment_method: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
