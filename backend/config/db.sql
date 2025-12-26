-- 球搭子网球赛事管理系统数据库

CREATE DATABASE IF NOT EXISTS tennis_tournament CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tennis_tournament;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 比赛表
CREATE TABLE IF NOT EXISTS tournaments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  format ENUM('short-set', 'best-of-3', 'best-of-5') DEFAULT 'short-set',
  scoring_method ENUM('ad', 'no-ad') DEFAULT 'no-ad',
  group_method ENUM('2-groups', '4-groups', 'no-groups') DEFAULT '2-groups',
  status ENUM('draft', 'registration', 'group-stage', 'knockout', 'finished') DEFAULT 'draft',
  rules_locked BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 选手表
CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  group_name VARCHAR(10),
  status ENUM('pending', 'approved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  INDEX idx_tournament (tournament_id),
  INDEX idx_group (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 比赛记录表
CREATE TABLE IF NOT EXISTS matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id INT NOT NULL,
  player1_id INT NOT NULL,
  player2_id INT NOT NULL,
  group_name VARCHAR(10),
  round_type ENUM('group', 'semi', 'final') DEFAULT 'group',
  status ENUM('pending', 'in-progress', 'finished') DEFAULT 'pending',
  sets_to_win INT DEFAULT 1,
  recorded_by INT,
  recorded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (player1_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (player2_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tournament (tournament_id),
  INDEX idx_group (group_name),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 盘分记录表
CREATE TABLE IF NOT EXISTS sets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  set_number INT NOT NULL,
  player1_games INT DEFAULT 0,
  player2_games INT DEFAULT 0,
  has_tiebreak BOOLEAN DEFAULT FALSE,
  tiebreak_player1 INT DEFAULT 0,
  tiebreak_player2 INT DEFAULT 0,
  winner_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_id) REFERENCES players(id) ON DELETE SET NULL,
  INDEX idx_match (match_id),
  UNIQUE KEY uk_match_set (match_id, set_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 比分记录表（逐分记录）
CREATE TABLE IF NOT EXISTS scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  set_id INT,
  point_number INT NOT NULL,
  player_id INT NOT NULL,
  point_type ENUM('normal', 'ace', 'fault', 'double-fault', 'out', 'let') DEFAULT 'normal',
  game_score_player1 VARCHAR(10),
  game_score_player2 VARCHAR(10),
  serving_player INT,
  is_tiebreak BOOLEAN DEFAULT FALSE,
  recorded_by INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_match (match_id),
  INDEX idx_set (set_id),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  tournament_id INT,
  match_id INT,
  action VARCHAR(50) NOT NULL,
  action_data JSON,
  can_undo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_tournament (tournament_id),
  INDEX idx_match (match_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认管理员账号（密码：admin123）
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'admin')
ON DUPLICATE KEY UPDATE username=username;

