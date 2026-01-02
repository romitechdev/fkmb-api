CREATE TYPE "public"."status_absensi" AS ENUM('hadir', 'izin', 'sakit', 'alpha');--> statement-breakpoint
CREATE TYPE "public"."jenis_transaksi" AS ENUM('pemasukan', 'pengeluaran');--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"permissions" json DEFAULT '[]'::json,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "departemen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"logo" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"nim" varchar(20),
	"phone" varchar(20),
	"fakultas" varchar(100),
	"prodi" varchar(100),
	"angkatan" varchar(10),
	"avatar" text,
	"role_id" uuid,
	"departemen_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"refresh_token" text,
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "kepengurusan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"departemen_id" uuid NOT NULL,
	"jabatan" varchar(100) NOT NULL,
	"periode" varchar(20) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kegiatan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"location" varchar(255),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"type" varchar(50),
	"status" varchar(20) DEFAULT 'upcoming' NOT NULL,
	"departemen_id" uuid,
	"created_by" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "absensi_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kegiatan_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"qr_code" text,
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "absensi_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "absensi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kegiatan_id" uuid NOT NULL,
	"token_id" uuid,
	"status" "status_absensi" DEFAULT 'hadir' NOT NULL,
	"check_in_time" timestamp DEFAULT now() NOT NULL,
	"note" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"periode" varchar(20) NOT NULL,
	"saldo_awal" numeric(15, 2) DEFAULT '0' NOT NULL,
	"saldo_akhir" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kas_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kas_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"jenis" "jenis_transaksi" NOT NULL,
	"kategori" varchar(100),
	"description" text NOT NULL,
	"jumlah" numeric(15, 2) NOT NULL,
	"bukti" text,
	"created_by" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laporan_kas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kas_id" uuid NOT NULL,
	"periode" varchar(50) NOT NULL,
	"total_pemasukan" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_pengeluaran" numeric(15, 2) DEFAULT '0' NOT NULL,
	"saldo_awal" numeric(15, 2) DEFAULT '0' NOT NULL,
	"saldo_akhir" numeric(15, 2) DEFAULT '0' NOT NULL,
	"file_url" text,
	"generated_by" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "arsip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"file_url" text NOT NULL,
	"file_type" varchar(50),
	"file_size" integer,
	"departemen_id" uuid,
	"uploaded_by" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_departemen_id_departemen_id_fk" FOREIGN KEY ("departemen_id") REFERENCES "public"."departemen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kepengurusan" ADD CONSTRAINT "kepengurusan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kepengurusan" ADD CONSTRAINT "kepengurusan_departemen_id_departemen_id_fk" FOREIGN KEY ("departemen_id") REFERENCES "public"."departemen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kegiatan" ADD CONSTRAINT "kegiatan_departemen_id_departemen_id_fk" FOREIGN KEY ("departemen_id") REFERENCES "public"."departemen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kegiatan" ADD CONSTRAINT "kegiatan_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi_token" ADD CONSTRAINT "absensi_token_kegiatan_id_kegiatan_id_fk" FOREIGN KEY ("kegiatan_id") REFERENCES "public"."kegiatan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_kegiatan_id_kegiatan_id_fk" FOREIGN KEY ("kegiatan_id") REFERENCES "public"."kegiatan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_token_id_absensi_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."absensi_token"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kas_detail" ADD CONSTRAINT "kas_detail_kas_id_kas_id_fk" FOREIGN KEY ("kas_id") REFERENCES "public"."kas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kas_detail" ADD CONSTRAINT "kas_detail_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_kas" ADD CONSTRAINT "laporan_kas_kas_id_kas_id_fk" FOREIGN KEY ("kas_id") REFERENCES "public"."kas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_kas" ADD CONSTRAINT "laporan_kas_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arsip" ADD CONSTRAINT "arsip_departemen_id_departemen_id_fk" FOREIGN KEY ("departemen_id") REFERENCES "public"."departemen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arsip" ADD CONSTRAINT "arsip_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;