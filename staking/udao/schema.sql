-- MariaDB dump 10.19  Distrib 10.6.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: pizzapalz
-- ------------------------------------------------------
-- Server version	10.6.14-MariaDB-1:10.6.14+maria~ubu1804

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date_last_snapshot` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `holders`
--

DROP TABLE IF EXISTS `holders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `holders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `wallet` varchar(64) NOT NULL DEFAULT '',
  `last_claimed_on` datetime DEFAULT NULL,
  `tokens_to_claim` decimal(20,9) NOT NULL DEFAULT 0.000000000,
  `last_snapshot_on` datetime DEFAULT NULL,
  `ctime` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `wallet` (`wallet`)
) ENGINE=InnoDB AUTO_INCREMENT=310 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `prepared`
--

DROP TABLE IF EXISTS `prepared`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prepared` (
  `id` varchar(64) NOT NULL DEFAULT '',
  `wallet` varchar(64) NOT NULL DEFAULT '',
  `transaction` text DEFAULT NULL,
  `mints` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mints`)),
  `tokens_to_claim` decimal(20,9) NOT NULL DEFAULT 0.000000000,
  `last_claimed_on` datetime DEFAULT NULL,
  `status` varchar(24) NOT NULL DEFAULT 'pending',
  `type` varchar(24) NOT NULL DEFAULT '',
  `txn_id` varchar(128) NOT NULL DEFAULT '',
  `error` text DEFAULT NULL,
  `ctime` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `prepared_holders`
--

DROP TABLE IF EXISTS `prepared_holders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prepared_holders` (
  `id` varchar(64) NOT NULL DEFAULT '',
  `wallet` varchar(64) NOT NULL DEFAULT '',
  `transaction` text DEFAULT NULL,
  `mints` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mints`)),
  `tokens_to_claim` int(11) NOT NULL DEFAULT 0,
  `status` varchar(24) NOT NULL DEFAULT 'pending',
  `txn_id` varchar(128) NOT NULL DEFAULT '',
  `error` text DEFAULT NULL,
  `ctime` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staked`
--

DROP TABLE IF EXISTS `staked`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `staked` (
  `wallet` varchar(64) NOT NULL DEFAULT '',
  `mint` varchar(64) NOT NULL DEFAULT '',
  `flag_for_deletion` tinyint(1) NOT NULL DEFAULT 0,
  `txn_id` varchar(128) NOT NULL DEFAULT '',
  `staked_on` datetime DEFAULT NULL,
  `token_yield` int(11) NOT NULL DEFAULT 0,
  `verified` tinyint(1) NOT NULL DEFAULT 0,
  `ctime` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`wallet`,`mint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `withdraws`
--

DROP TABLE IF EXISTS `withdraws`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `withdraws` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tokens_withdrawn` decimal(20,9) NOT NULL DEFAULT 0.000000000,
  `wallet` varchar(64) NOT NULL DEFAULT '',
  `withdrawn_on` date DEFAULT NULL,
  `ctime` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1346 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-08-03 10:14:51
