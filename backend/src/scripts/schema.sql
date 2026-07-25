-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'faculty', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student selections (enrollments)
CREATE TABLE IF NOT EXISTS student_selection (
  id SERIAL PRIMARY KEY,
  enrollment_number VARCHAR(20) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  department_code VARCHAR(10),
  department_name VARCHAR(255),
  semester VARCHAR(10),
  status VARCHAR(50),
  bucket TEXT,
  course_code VARCHAR(20),
  course_name VARCHAR(255),
  faculty VARCHAR(255),
  rooms TEXT,
  batch_number VARCHAR(10),
  slots TEXT
);

CREATE INDEX IF NOT EXISTS idx_student_selection_enrollment ON student_selection(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_student_selection_course_code ON student_selection(course_code);
CREATE INDEX IF NOT EXISTS idx_student_selection_department ON student_selection(department_code);
CREATE INDEX IF NOT EXISTS idx_student_selection_semester ON student_selection(semester);

-- Timetable (combined theory + lab master schedule)
CREATE TABLE IF NOT EXISTS timetable (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('theory', 'lab')),
  day VARCHAR(20) NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  course_code VARCHAR(20),
  course_name VARCHAR(255),
  teacher_name VARCHAR(255),
  room_number VARCHAR(50),
  block VARCHAR(50),
  department VARCHAR(255),
  semester VARCHAR(10),
  group_name VARCHAR(255),
  capacity INTEGER,
  student_count INTEGER,
  session_name VARCHAR(100),
  is_batched BOOLEAN DEFAULT FALSE,
  batch_label VARCHAR(50),
  source_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_timetable_type ON timetable(type);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable(day);
CREATE INDEX IF NOT EXISTS idx_timetable_course_code ON timetable(course_code);
CREATE INDEX IF NOT EXISTS idx_timetable_department ON timetable(department);
CREATE INDEX IF NOT EXISTS idx_timetable_room ON timetable(room_number);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable(teacher_name);
CREATE INDEX IF NOT EXISTS idx_timetable_semester ON timetable(semester);
