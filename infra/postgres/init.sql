CREATE USER mint_auth_user WITH PASSWORD 'mint_auth_pass';
CREATE DATABASE mint_auth OWNER mint_auth_user;
GRANT ALL PRIVILEGES ON DATABASE mint_auth TO mint_auth_user;

CREATE USER mint_wallet_user WITH PASSWORD 'mint_wallet_pass';
CREATE DATABASE mint_wallet OWNER mint_wallet_user;
GRANT ALL PRIVILEGES ON DATABASE mint_wallet TO mint_wallet_user;

CREATE USER mint_txns_user WITH PASSWORD 'mint_txns_pass';
CREATE DATABASE mint_txns OWNER mint_txns_user;
GRANT ALL PRIVILEGES ON DATABASE mint_txns TO mint_txns_user;

CREATE USER mint_fraud_user WITH PASSWORD 'mint_fraud_pass';
CREATE DATABASE mint_fraud OWNER mint_fraud_user;
GRANT ALL PRIVILEGES ON DATABASE mint_fraud TO mint_fraud_user;

CREATE USER mint_kyc_user WITH PASSWORD 'mint_kyc_pass';
CREATE DATABASE mint_kyc OWNER mint_kyc_user;
GRANT ALL PRIVILEGES ON DATABASE mint_kyc TO mint_kyc_user;

CREATE USER mint_analytics_user WITH PASSWORD 'mint_analytics_pass';
CREATE DATABASE mint_analytics OWNER mint_analytics_user;
GRANT ALL PRIVILEGES ON DATABASE mint_analytics TO mint_analytics_user;

CREATE USER mint_notifications_user WITH PASSWORD 'mint_notifications_pass';
CREATE DATABASE mint_notifications OWNER mint_notifications_user;
GRANT ALL PRIVILEGES ON DATABASE mint_notifications TO mint_notifications_user;

-- Add a new block here for each service as you build them:
-- CREATE USER mint_{svc}_user WITH PASSWORD 'mint_{svc}_pass';
-- CREATE DATABASE mint_{svc} OWNER mint_{svc}_user;
-- GRANT ALL PRIVILEGES ON DATABASE mint_{svc} TO mint_{svc}_user;
