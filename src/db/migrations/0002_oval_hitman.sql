ALTER TABLE "absensi" DROP CONSTRAINT "absensi_token_id_absensi_token_id_fk";
--> statement-breakpoint
ALTER TABLE "absensi" ADD COLUMN "token_label" varchar(255);--> statement-breakpoint
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_token_id_absensi_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."absensi_token"("id") ON DELETE set null ON UPDATE no action;