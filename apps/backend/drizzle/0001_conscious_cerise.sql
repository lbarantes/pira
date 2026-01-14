CREATE TYPE "public"."group_status_enum" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_name" varchar(100) NOT NULL,
	"group_description" varchar(1000) NOT NULL,
	"group_avatar" varchar NOT NULL,
	"group_owner" uuid NOT NULL,
	"group_status" "group_status_enum" DEFAULT 'active' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_groups" (
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"joined_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_groups_roles" (
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"role_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_role_permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"group_can_manage_roles" boolean DEFAULT false NOT NULL,
	"group_can_view_channels" boolean DEFAULT false NOT NULL,
	"group_can_manage_channels" boolean DEFAULT false NOT NULL,
	"members_can_invite" boolean DEFAULT false NOT NULL,
	"members_can_kick" boolean DEFAULT false NOT NULL,
	"members_can_ban" boolean DEFAULT false NOT NULL,
	"chat_can_send_messages" boolean DEFAULT false NOT NULL,
	"chat_can_send_links" boolean DEFAULT false NOT NULL,
	"chat_can_send_files" boolean DEFAULT false NOT NULL,
	"chat_can_manage_messages" boolean DEFAULT false NOT NULL,
	"chat_can_fix_messages" boolean DEFAULT false NOT NULL,
	"chat_can_view_history" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"role_name" varchar NOT NULL,
	"role_color" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"channel_name" varchar(100) NOT NULL,
	"channel_description" varchar(1000) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_role_permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"channel_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"channel_can_view_channel" boolean DEFAULT false NOT NULL,
	"channel_can_manage_channel" boolean DEFAULT false NOT NULL,
	"chat_can_send_messages" boolean DEFAULT false NOT NULL,
	"chat_can_send_links" boolean DEFAULT false NOT NULL,
	"chat_can_send_files" boolean DEFAULT false NOT NULL,
	"chat_can_manage_messages" boolean DEFAULT false NOT NULL,
	"chat_can_fix_messages" boolean DEFAULT false NOT NULL,
	"chat_can_view_history" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_user_permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"channel_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"channel_can_view_channel" boolean DEFAULT false NOT NULL,
	"channel_can_manage_channel" boolean DEFAULT false NOT NULL,
	"chat_can_send_messages" boolean DEFAULT false NOT NULL,
	"chat_can_send_links" boolean DEFAULT false NOT NULL,
	"chat_can_send_files" boolean DEFAULT false NOT NULL,
	"chat_can_manage_messages" boolean DEFAULT false NOT NULL,
	"chat_can_fix_messages" boolean DEFAULT false NOT NULL,
	"chat_can_view_history" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_group_owner_users_id_fk" FOREIGN KEY ("group_owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_groups_roles" ADD CONSTRAINT "user_groups_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_groups_roles" ADD CONSTRAINT "user_groups_roles_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_groups_roles" ADD CONSTRAINT "user_groups_roles_role_id_group_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."group_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_role_permissions" ADD CONSTRAINT "group_role_permissions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_role_permissions" ADD CONSTRAINT "group_role_permissions_role_id_group_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."group_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_roles" ADD CONSTRAINT "group_roles_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_role_permissions" ADD CONSTRAINT "channel_role_permissions_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_role_permissions" ADD CONSTRAINT "channel_role_permissions_role_id_group_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."group_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_user_permissions" ADD CONSTRAINT "channel_user_permissions_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_user_permissions" ADD CONSTRAINT "channel_user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;