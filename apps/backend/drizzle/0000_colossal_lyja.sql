CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"password_hash" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
