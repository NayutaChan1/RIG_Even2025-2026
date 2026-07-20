CREATE TABLE "door_lock_history" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"status" text NOT NULL,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projector_history" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"turned_on_at" timestamp,
	"turned_off_at" timestamp,
	"light_sensor_value" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"typed_at" timestamp DEFAULT now(),
	"user_id" text NOT NULL,
	"room_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"flazz" char(8),
	"hash_pass" varchar(255) NOT NULL,
	"initial" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_flazz_unique" UNIQUE("flazz"),
	CONSTRAINT "users_initial_unique" UNIQUE("initial")
);
--> statement-breakpoint
CREATE TABLE "users_messier" (
	"flazz_id" char(8) PRIMARY KEY NOT NULL,
	"initial" text NOT NULL,
	"messier_password" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "door_lock_history" ADD CONSTRAINT "door_lock_history_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projector_history" ADD CONSTRAINT "projector_history_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;