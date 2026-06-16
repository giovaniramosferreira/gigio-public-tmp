-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "niche" TEXT,
    "target_audience" TEXT,
    "tone_profile_json" TEXT,
    "banned_patterns_json" TEXT,
    "render_defaults_json" TEXT,
    "review_mode" TEXT NOT NULL DEFAULT 'review-before-publish',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "default_voice_id" TEXT,
    "default_voice_provider" TEXT,
    "youtube_channel_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "editorial_pillars" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "weight" REAL NOT NULL DEFAULT 0.5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "editorial_pillars_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_ideas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel_id" TEXT NOT NULL,
    "pillar_id" TEXT,
    "title" TEXT NOT NULL,
    "hook" TEXT,
    "angle" TEXT,
    "why_underdiscussed" TEXT,
    "why_now" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "total_score" REAL,
    "score_breakdown_json" TEXT,
    "originality_score" REAL,
    "originality_checked_at" DATETIME,
    "source" TEXT,
    "seed_phrase" TEXT,
    "competitor_urls" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "content_ideas_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "content_ideas_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "editorial_pillars" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "script_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content_idea_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "thesis" TEXT,
    "audience_frame" TEXT,
    "hook_variants_json" TEXT,
    "selected_hook" TEXT,
    "beat_plan_json" TEXT,
    "full_script" TEXT,
    "word_count" INTEGER,
    "estimated_duration_seconds" REAL,
    "critic_notes_json" TEXT,
    "originality_score" REAL,
    "rewrite_count" INTEGER NOT NULL DEFAULT 0,
    "rewrite_instructions" TEXT,
    "approved_at" DATETIME,
    "approved_by" TEXT,
    "generation_model" TEXT,
    "generation_prompt_version" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "script_packages_content_idea_id_fkey" FOREIGN KEY ("content_idea_id") REFERENCES "content_ideas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "script_package_id" TEXT NOT NULL,
    "visual_style_notes" TEXT,
    "scene_prompts_json" TEXT,
    "text_overlay_options_json" TEXT,
    "provenance_json" TEXT,
    "total_scenes" INTEGER,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "asset_plans_script_package_id_fkey" FOREIGN KEY ("script_package_id") REFERENCES "script_packages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "voice_renders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "script_package_id" TEXT NOT NULL,
    "voice_id" TEXT NOT NULL,
    "voice_name" TEXT,
    "provider" TEXT NOT NULL,
    "settings_json" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "audio_file_path" TEXT,
    "duration_seconds" REAL,
    "file_size_bytes" INTEGER,
    "sample_rate" INTEGER,
    "format" TEXT,
    "provider_request_id" TEXT,
    "cost_credits" REAL,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "voice_renders_script_package_id_fkey" FOREIGN KEY ("script_package_id") REFERENCES "script_packages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "caption_tracks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "script_package_id" TEXT NOT NULL,
    "voice_render_id" TEXT,
    "source_type" TEXT,
    "srt_path" TEXT,
    "vtt_path" TEXT,
    "timing_json" TEXT,
    "word_count" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "caption_tracks_script_package_id_fkey" FOREIGN KEY ("script_package_id") REFERENCES "script_packages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "caption_tracks_voice_render_id_fkey" FOREIGN KEY ("voice_render_id") REFERENCES "voice_renders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "video_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel_id" TEXT NOT NULL,
    "script_package_id" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_ASSETS',
    "render_spec_json" TEXT,
    "preview_file_path" TEXT,
    "export_file_path" TEXT,
    "duration_seconds" REAL,
    "resolution" TEXT,
    "aspect_ratio" TEXT,
    "frame_rate" REAL,
    "file_size_bytes" INTEGER,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "video_projects_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "video_projects_script_package_id_fkey" FOREIGN KEY ("script_package_id") REFERENCES "script_packages" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "thumbnail_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "video_project_id" TEXT NOT NULL,
    "variant_label" TEXT NOT NULL,
    "image_path" TEXT,
    "prompt" TEXT,
    "provider" TEXT,
    "readability_score" REAL,
    "similarity_score" REAL,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "file_size_bytes" INTEGER,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "thumbnail_variants_video_project_id_fkey" FOREIGN KEY ("video_project_id") REFERENCES "video_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "metadata_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "video_project_id" TEXT NOT NULL,
    "titles_json" TEXT,
    "title" TEXT NOT NULL,
    "descriptions_json" TEXT,
    "description" TEXT,
    "hashtags_json" TEXT,
    "tags" TEXT,
    "pinned_comment" TEXT,
    "risk_notes_json" TEXT,
    "category_id" TEXT,
    "language" TEXT DEFAULT 'en',
    "made_for_kids" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "scheduled_publish_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "metadata_packages_video_project_id_fkey" FOREIGN KEY ("video_project_id") REFERENCES "video_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "qa_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "video_project_id" TEXT NOT NULL,
    "job_run_id" TEXT,
    "decision" TEXT,
    "overall_score" REAL,
    "originality_risk_score" REAL,
    "reused_risk_score" REAL,
    "technical_risk_score" REAL,
    "audio_score" REAL,
    "caption_sync_score" REAL,
    "visual_score" REAL,
    "duration_score" REAL,
    "reason_codes_json" TEXT,
    "report_json" TEXT,
    "reviewer_notes" TEXT,
    "reviewed_at" DATETIME,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "qa_runs_video_project_id_fkey" FOREIGN KEY ("video_project_id") REFERENCES "video_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "publish_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "video_project_id" TEXT NOT NULL,
    "export_folder_path" TEXT,
    "video_file_path" TEXT,
    "thumbnail_file_path" TEXT,
    "metadata_json_path" TEXT,
    "captions_path" TEXT,
    "approval_status" TEXT,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "manual_upload_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "youtube_video_id" TEXT,
    "uploaded_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "publish_packages_video_project_id_fkey" FOREIGN KEY ("video_project_id") REFERENCES "video_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "video_project_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "snapshot_date" DATETIME NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "subscribers_gained" INTEGER NOT NULL DEFAULT 0,
    "watch_time_seconds" REAL,
    "average_view_duration_seconds" REAL,
    "average_view_percentage" REAL,
    "impressions" INTEGER,
    "ctr" REAL,
    "revenue_usd" REAL,
    "raw_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_snapshots_video_project_id_fkey" FOREIGN KEY ("video_project_id") REFERENCES "video_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analytics_snapshots_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "entity_type" TEXT,
    "entity_id" TEXT,
    "input_json" TEXT,
    "result_id" TEXT,
    "result_json" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "error_details_json" TEXT,
    "logs" TEXT,
    "queued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "duration_ms" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_slug_key" ON "channels"("slug");

-- CreateIndex
CREATE INDEX "channels_youtube_channel_id_idx" ON "channels"("youtube_channel_id");

-- CreateIndex
CREATE INDEX "editorial_pillars_channel_id_idx" ON "editorial_pillars"("channel_id");

-- CreateIndex
CREATE INDEX "content_ideas_channel_id_idx" ON "content_ideas"("channel_id");

-- CreateIndex
CREATE INDEX "content_ideas_pillar_id_idx" ON "content_ideas"("pillar_id");

-- CreateIndex
CREATE INDEX "content_ideas_status_idx" ON "content_ideas"("status");

-- CreateIndex
CREATE INDEX "content_ideas_total_score_idx" ON "content_ideas"("total_score");

-- CreateIndex
CREATE UNIQUE INDEX "script_packages_content_idea_id_key" ON "script_packages"("content_idea_id");

-- CreateIndex
CREATE INDEX "script_packages_content_idea_id_idx" ON "script_packages"("content_idea_id");

-- CreateIndex
CREATE INDEX "script_packages_status_idx" ON "script_packages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "asset_plans_script_package_id_key" ON "asset_plans"("script_package_id");

-- CreateIndex
CREATE INDEX "asset_plans_script_package_id_idx" ON "asset_plans"("script_package_id");

-- CreateIndex
CREATE INDEX "voice_renders_script_package_id_idx" ON "voice_renders"("script_package_id");

-- CreateIndex
CREATE INDEX "voice_renders_status_idx" ON "voice_renders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "caption_tracks_script_package_id_key" ON "caption_tracks"("script_package_id");

-- CreateIndex
CREATE INDEX "caption_tracks_script_package_id_idx" ON "caption_tracks"("script_package_id");

-- CreateIndex
CREATE INDEX "caption_tracks_voice_render_id_idx" ON "caption_tracks"("voice_render_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_projects_script_package_id_key" ON "video_projects"("script_package_id");

-- CreateIndex
CREATE INDEX "video_projects_channel_id_idx" ON "video_projects"("channel_id");

-- CreateIndex
CREATE INDEX "video_projects_status_idx" ON "video_projects"("status");

-- CreateIndex
CREATE INDEX "thumbnail_variants_video_project_id_idx" ON "thumbnail_variants"("video_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "metadata_packages_video_project_id_key" ON "metadata_packages"("video_project_id");

-- CreateIndex
CREATE INDEX "metadata_packages_video_project_id_idx" ON "metadata_packages"("video_project_id");

-- CreateIndex
CREATE INDEX "qa_runs_video_project_id_idx" ON "qa_runs"("video_project_id");

-- CreateIndex
CREATE INDEX "qa_runs_decision_idx" ON "qa_runs"("decision");

-- CreateIndex
CREATE INDEX "qa_runs_created_at_idx" ON "qa_runs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "publish_packages_video_project_id_key" ON "publish_packages"("video_project_id");

-- CreateIndex
CREATE INDEX "publish_packages_youtube_video_id_idx" ON "publish_packages"("youtube_video_id");

-- CreateIndex
CREATE INDEX "analytics_snapshots_video_project_id_idx" ON "analytics_snapshots"("video_project_id");

-- CreateIndex
CREATE INDEX "analytics_snapshots_channel_id_idx" ON "analytics_snapshots"("channel_id");

-- CreateIndex
CREATE INDEX "analytics_snapshots_snapshot_date_idx" ON "analytics_snapshots"("snapshot_date");

-- CreateIndex
CREATE INDEX "job_runs_job_type_idx" ON "job_runs"("job_type");

-- CreateIndex
CREATE INDEX "job_runs_status_idx" ON "job_runs"("status");

-- CreateIndex
CREATE INDEX "job_runs_entity_id_idx" ON "job_runs"("entity_id");

-- CreateIndex
CREATE INDEX "job_runs_queued_at_idx" ON "job_runs"("queued_at");
