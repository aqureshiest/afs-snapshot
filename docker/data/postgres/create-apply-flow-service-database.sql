CREATE DATABASE applyflowservice;
\c applyflowservice;

CREATE ROLE applyflowservice;

CREATE SCHEMA test AUTHORIZATION applyflowservice;

GRANT ALL ON DATABASE applyflowservice TO applyflowservice;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public,test TO applyflowservice;
ALTER DEFAULT PRIVILEGES IN SCHEMA public,test GRANT ALL ON TABLES TO applyflowservice;

CREATE USER earnest WITH PASSWORD 'earnest';
GRANT applyflowservice TO earnest;

GRANT USAGE ON SCHEMA test TO postgres, earnest, applyflowservice;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

