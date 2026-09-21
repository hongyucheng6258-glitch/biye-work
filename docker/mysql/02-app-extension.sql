USE ai_campus_platform;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `favorite` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `target_type` varchar(16) NOT NULL,
  `target_id` bigint NOT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_target` (`user_id`,`target_type`,`target_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `study_partner` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `subject` varchar(64) NOT NULL,
  `goal` varchar(128) DEFAULT '',
  `schedule` varchar(255) DEFAULT '',
  `intro` varchar(500) DEFAULT '',
  `contact` varchar(64) DEFAULT '',
  `status` tinyint DEFAULT '0',
  `audit_status` tinyint DEFAULT '0',
  `audit_reason` varchar(255) DEFAULT NULL,
  `ai_risk_level` tinyint DEFAULT NULL,
  `ai_audit_reason` varchar(255) DEFAULT NULL,
  `ai_audit_time` datetime DEFAULT NULL,
  `audit_source` varchar(20) DEFAULT 'manual',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_partner_audit` (`audit_status`,`status`),
  KEY `idx_partner_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习搭子';

CREATE TABLE IF NOT EXISTS `campus_question` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(128) NOT NULL,
  `content` text,
  `category` varchar(32) DEFAULT '其他',
  `status` tinyint DEFAULT '0',
  `accepted_answer_id` bigint DEFAULT NULL,
  `view_count` int DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_question_status` (`status`),
  KEY `idx_question_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='校园互助问答-问题';

CREATE TABLE IF NOT EXISTS `campus_answer` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `content` text NOT NULL,
  `is_accepted` tinyint DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_answer_qid` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='校园互助问答-回答';

CREATE TABLE IF NOT EXISTS `lost_found_claim` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `lost_found_id` bigint NOT NULL,
  `claim_user_id` bigint NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  `contact` varchar(64) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lf` (`lost_found_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
