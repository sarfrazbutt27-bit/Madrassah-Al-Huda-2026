
-- Seed Users
INSERT OR IGNORE INTO users (id, name, email, role, password) VALUES
('admin-fixed', 'Sarfraz Azmat Butt', 'sarfrazbutt27@gmail.com', 'PRINCIPAL', 'admin'),
('teacher-1', 'Ahmed Hassan', 'ahmed@example.com', 'TEACHER', 'teacher123');

-- Seed Students
INSERT OR IGNORE INTO students (id, first_name, last_name, gender, birth_date, class_name, status) VALUES
('S001', 'Zaid', 'Ahmed', 'Junge', '2015-05-15', 'Class A', 'active'),
('S002', 'Fatima', 'Zahra', 'Mädchen', '2016-08-20', 'Class B', 'active');

-- Seed Class Configs
INSERT OR IGNORE INTO class_configs (class_name, whatsapp_link) VALUES
('Class A', 'https://chat.whatsapp.com/example-a'),
('Class B', 'https://chat.whatsapp.com/example-b');
