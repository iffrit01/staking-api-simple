CREATE TABLE config (
  id int unsigned NOT NULL AUTO_INCREMENT,
  date_last_snapshot date DEFAULT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE holders (
  id int unsigned NOT NULL AUTO_INCREMENT,
  wallet varchar(64) NOT NULL DEFAULT '',
  last_claimed_on datetime DEFAULT NULL,
  tokens_to_claim decimal(20,9) NOT NULL DEFAULT '0.000000000',
  last_snapshot_on datetime DEFAULT NULL,
  ctime datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY wallet (wallet)
);

CREATE TABLE prepared (
  id varchar(64) NOT NULL DEFAULT '',
  wallet varchar(64) NOT NULL DEFAULT '',
  transaction text,
  mints json DEFAULT NULL,
  tokens_to_claim decimal(20,9) NOT NULL DEFAULT '0.000000000',
  last_claimed_on datetime DEFAULT NULL,
  status varchar(24) NOT NULL DEFAULT 'pending',
  type varchar(24) NOT NULL DEFAULT '',
  txn_id varchar(128) NOT NULL DEFAULT '',
  error text,
  ctime datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE prepared_holders (
  id varchar(64) NOT NULL DEFAULT '',
  wallet varchar(64) NOT NULL DEFAULT '',
  transaction text,
  mints json DEFAULT NULL,
  tokens_to_claim int NOT NULL DEFAULT '0',
  status varchar(24) NOT NULL DEFAULT 'pending',
  txn_id varchar(128) NOT NULL DEFAULT '',
  error text,
  ctime datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE staked (
  wallet varchar(64) NOT NULL DEFAULT '',
  mint varchar(64) NOT NULL DEFAULT '',
  flag_for_deletion tinyint(1) NOT NULL DEFAULT '0',
  txn_id varchar(128) NOT NULL DEFAULT '',
  staked_on datetime DEFAULT NULL,
  token_yield int NOT NULL DEFAULT '0',
  verified tinyint(1) NOT NULL DEFAULT '0',
  ctime datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (wallet,mint)
);

CREATE TABLE withdraws (
  id int unsigned NOT NULL AUTO_INCREMENT,
  tokens_withdrawn decimal(20,9) NOT NULL DEFAULT '0.000000000',
  wallet varchar(64) NOT NULL DEFAULT '',
  withdrawn_on date DEFAULT NULL,
  ctime datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);



