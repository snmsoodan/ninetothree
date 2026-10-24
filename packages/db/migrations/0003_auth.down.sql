drop table if exists auth_attempts;
drop table if exists verification_tokens;
drop table if exists sessions;
drop table if exists accounts;
alter table users drop column if exists image;
alter table users drop column if exists email_verified;
