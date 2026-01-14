CREATE TYPE "public"."invite_expiration_enum" AS ENUM('30_minutes', '1_hour', '6_hours', '12_hours', '1_day', '7_days');--> statement-breakpoint
CREATE TYPE "public"."invite_uses_enum" AS ENUM('unlimited', '1_use', '5_uses', '10_uses', '25_uses', '50_uses', '100_uses');--> statement-breakpoint
CREATE TABLE "group_invites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"token" varchar(256) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"expiration_type" "invite_expiration_enum" NOT NULL,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"uses_type" "invite_uses_enum" NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "group_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;