# DarkTube OS — API Contracts
Version: 1.0

---

## General Conventions

- **Base path:** `/api`
- **Content-Type:** `application/json` for all requests and responses
- **All IDs:** CUID strings (e.g. `clx4m2k0d0000z9v8fk3a1b2c`)
- **Timestamps:** ISO 8601 strings (e.g. `2026-06-16T10:00:00.000Z`)
- **Long-running endpoints:** Return `{ jobId: string, status: 'queued' }` immediately; client polls `GET /api/jobs/:id` for completion
- **Errors:** All error responses use the shape `{ error: { code: string, message: string, details?: unknown } }`
- **Pagination:** List endpoints accept `page` (1-based, default 1) and `limit` (default 20, max 100)

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK — successful read or update |
| 201 | Created — resource created successfully |
| 400 | Bad Request — malformed request body or query params |
| 404 | Not Found — entity does not exist |
| 409 | Conflict — duplicate or state conflict |
| 422 | Unprocessable Entity — valid syntax but business rule violation |
| 500 | Internal Server Error — unexpected failure |

---

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body or params failed schema validation |
| `NOT_FOUND` | 404 | Requested entity does not exist |
| `CONFLICT` | 409 | Duplicate entity or invalid state transition |
| `PROVIDER_ERROR` | 502 | External AI/media provider returned an error |
| `PROVIDER_TIMEOUT` | 504 | External provider did not respond in time |
| `ORIGINALITY_BLOCKED` | 422 | Idea blocked due to low originality score |
| `QA_BLOCKED` | 422 | Video blocked by QA — rewrite required |
| `MISSING_ASSET` | 422 | Required asset file not found on disk |
| `JOB_FAILED` | 500 | Background job failed — see job error for details |

---

## TypeScript Base Types

```typescript
// Shared response envelope types

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface JobQueuedResponse {
  jobId: string
  status: 'queued'
}

interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
```

---

## Endpoints

### Channels

#### POST /api/channels

Creates a new channel.

**Request body:**
```typescript
interface CreateChannelRequest {
  name: string
  slug: string
  description?: string
  niche?: string
  targetAudience?: string
  toneProfile?: {
    voice?: string
    pace?: string
    energy?: string
    vocabularyLevel?: string
    humor?: string
    forbiddenPhrases?: string[]
    brandKeywords?: string[]
    preferredStructures?: string[]
  }
  defaultVoiceId?: string
  defaultVoiceProvider?: string
  youtubeChannelId?: string
}
```

**Response:** `201 Created`
```typescript
interface CreateChannelResponse {
  id: string
  name: string
  slug: string
  description: string | null
  niche: string | null
  targetAudience: string | null
  toneProfile: Record<string, unknown> | null
  defaultVoiceId: string | null
  defaultVoiceProvider: string | null
  youtubeChannelId: string | null
  createdAt: string
  updatedAt: string
}
```

**Example:**
```json
// POST /api/channels
// Body:
{
  "name": "Dark Insights",
  "slug": "dark-insights",
  "niche": "business psychology",
  "toneProfile": {
    "voice": "authoritative",
    "pace": "fast",
    "energy": "high"
  }
}

// Response 201:
{
  "id": "clx4m2k0d0000z9v8fk3a1b2c",
  "name": "Dark Insights",
  "slug": "dark-insights",
  "niche": "business psychology",
  "toneProfile": { "voice": "authoritative", "pace": "fast", "energy": "high" },
  "createdAt": "2026-06-16T10:00:00.000Z",
  "updatedAt": "2026-06-16T10:00:00.000Z"
}
```

---

#### GET /api/channels

Returns all channels.

**Query parameters:**
```typescript
interface ListChannelsQuery {
  page?: number    // default 1
  limit?: number   // default 20
}
```

**Response:** `200 OK`
```typescript
type ListChannelsResponse = PaginatedResponse<CreateChannelResponse>
```

**Example:**
```json
// GET /api/channels
{
  "data": [
    {
      "id": "clx4m2k0d0000z9v8fk3a1b2c",
      "name": "Dark Insights",
      "slug": "dark-insights",
      "createdAt": "2026-06-16T10:00:00.000Z",
      "updatedAt": "2026-06-16T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

#### PATCH /api/channels/:id

Updates an existing channel. All fields are optional; only provided fields are updated.

**Request body:**
```typescript
interface UpdateChannelRequest {
  name?: string
  slug?: string
  description?: string
  niche?: string
  targetAudience?: string
  toneProfile?: Record<string, unknown>
  defaultVoiceId?: string
  defaultVoiceProvider?: string
  youtubeChannelId?: string
}
```

**Response:** `200 OK` — full updated channel object (same shape as `CreateChannelResponse`)

---

### Ideas

#### POST /api/ideas/discover

Triggers an idea discovery job for a channel. Long-running.

**Request body:**
```typescript
interface DiscoverIdeasRequest {
  channelId: string
  pillarId?: string
  seedPhrases?: string[]
  count?: number    // target number of ideas to discover, default 10
}
```

**Response:** `200 OK`
```typescript
type DiscoverIdeasResponse = JobQueuedResponse
// { jobId: string, status: 'queued' }
```

On job completion, `JobRun.resultJson` contains:
```typescript
interface DiscoverIdeasResult {
  discoveredCount: number
  ideaIds: string[]
}
```

---

#### GET /api/ideas

Returns a paginated list of ideas.

**Query parameters:**
```typescript
interface ListIdeasQuery {
  channelId: string
  status?: string        // filter by IdeaStatus
  pillarId?: string
  page?: number
  limit?: number
}
```

**Response:** `200 OK`
```typescript
interface IdeaSummary {
  id: string
  channelId: string
  pillarId: string | null
  title: string
  hook: string | null
  status: string
  totalScore: number | null
  createdAt: string
  updatedAt: string
}

type ListIdeasResponse = PaginatedResponse<IdeaSummary>
```

---

#### GET /api/ideas/:id

Returns a single idea with full score breakdown.

**Response:** `200 OK`
```typescript
interface IdeaDetailResponse {
  id: string
  channelId: string
  pillarId: string | null
  title: string
  hook: string | null
  angle: string | null
  status: string
  totalScore: number | null
  scoreBreakdown: {
    trend_score: number
    originality_score: number
    hook_strength: number
    search_volume: number
    competition_gap: number
    audience_fit: number
    production_feasibility: number
    weights: Record<string, number>
    scorerModel: string
    scoredAt: string
  } | null
  originalityScore: number | null
  originalityCheckedAt: string | null
  source: string | null
  seedPhrase: string | null
  competitorUrls: string[] | null
  createdAt: string
  updatedAt: string
}
```

---

#### POST /api/ideas/:id/score

Triggers a scoring job for the idea.

**Request body:** None

**Response:** `200 OK`
```typescript
type ScoreIdeaResponse = JobQueuedResponse
```

---

#### POST /api/ideas/:id/select

Marks an idea as `SELECTED`. The idea must be in `SCORED` status.

**Request body:** None

**Response:** `200 OK` — updated `IdeaDetailResponse`

**Errors:**
- `422 CONFLICT` — idea is not in `SCORED` status

---

### Scripts

#### POST /api/scripts/generate

Triggers script generation for a selected idea. Long-running.

**Request body:**
```typescript
interface GenerateScriptRequest {
  ideaId: string
}
```

**Response:** `200 OK`
```typescript
type GenerateScriptResponse = JobQueuedResponse
```

On job completion, `JobRun.resultId` is the created `ScriptPackage.id`.

---

#### GET /api/scripts/:id

Returns a full script package.

**Response:** `200 OK`
```typescript
interface ScriptPackageResponse {
  id: string
  contentIdeaId: string
  videoProjectId: string | null
  status: string
  title: string
  selectedHook: string | null
  hookVariants: Array<{
    index: number
    text: string
    style: string
    estimatedRetentionScore: number
  }> | null
  beatPlan: Array<{
    beatIndex: number
    label: string
    targetSeconds: [number, number]
    description: string
    scriptExcerpt: string
  }> | null
  fullScript: string | null
  wordCount: number | null
  estimatedDurationSeconds: number | null
  criticNotes: {
    overallVerdict: string
    scores: Record<string, number>
    issues: Array<{ severity: string; category: string; beatIndex?: number; note: string }>
    suggestions: string[]
    criticModel: string
    criticizedAt: string
  } | null
  rewriteCount: number
  approvedAt: string | null
  approvedBy: string | null
  generationModel: string | null
  createdAt: string
  updatedAt: string
}
```

---

#### POST /api/scripts/:id/critic

Triggers a critic pass on the script. Long-running.

**Request body:** None

**Response:** `200 OK`
```typescript
type RunCriticResponse = JobQueuedResponse
```

---

#### POST /api/scripts/:id/rewrite

Triggers a rewrite job. The script must be in `CRITIC_REVIEW` or `BLOCKED` status.

**Request body:**
```typescript
interface RewriteScriptRequest {
  instructions?: string    // human instructions to guide the rewrite
}
```

**Response:** `200 OK`
```typescript
type RewriteScriptResponse = JobQueuedResponse
```

---

#### POST /api/scripts/:id/approve

Marks a script as `APPROVED_FOR_PRODUCTION`. The script must be in `CRITIC_REVIEW` status with a passing verdict.

**Request body:** None

**Response:** `200 OK` — updated `ScriptPackageResponse`

**Errors:**
- `422 CONFLICT` — script is not in an approvable state

---

### Production

#### POST /api/assets/generate

Triggers asset generation for a script package. Long-running.

**Request body:**
```typescript
interface GenerateAssetsRequest {
  scriptPackageId: string
}
```

**Response:** `200 OK`
```typescript
type GenerateAssetsResponse = JobQueuedResponse
```

---

#### POST /api/voice/render

Triggers voiceover rendering. Long-running.

**Request body:**
```typescript
interface RenderVoiceRequest {
  scriptPackageId: string
  voiceId?: string          // overrides channel default
  provider?: string         // overrides channel default, e.g. "elevenlabs"
}
```

**Response:** `200 OK`
```typescript
type RenderVoiceResponse = JobQueuedResponse
```

---

#### POST /api/captions/generate

Triggers caption generation from the voice render. Long-running.

**Request body:**
```typescript
interface GenerateCaptionsRequest {
  scriptPackageId: string
}
```

**Response:** `200 OK`
```typescript
type GenerateCaptionsResponse = JobQueuedResponse
```

---

#### POST /api/videos/assemble

Triggers preview video assembly. All assets, voice, and captions must be complete. Long-running.

**Request body:**
```typescript
interface AssembleVideoRequest {
  videoProjectId: string
}
```

**Response:** `200 OK`
```typescript
type AssembleVideoResponse = JobQueuedResponse
```

---

#### GET /api/videos/:id

Returns a full VideoProject with all related entities.

**Response:** `200 OK`
```typescript
interface VideoProjectResponse {
  id: string
  channelId: string
  scriptPackageId: string | null
  title: string
  status: string
  renderSpec: Record<string, unknown> | null
  previewFilePath: string | null
  exportFilePath: string | null
  durationSeconds: number | null
  resolution: string | null
  frameRate: number | null
  fileSizeBytes: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  // Related entities
  scriptPackage: ScriptPackageResponse | null
  thumbnailVariants: ThumbnailVariantResponse[]
  metadataPackage: MetadataPackageResponse | null
  latestQaRun: QaRunResponse | null
  publishPackage: PublishPackageResponse | null
}

interface ThumbnailVariantResponse {
  id: string
  videoProjectId: string
  variantLabel: string
  imagePath: string | null
  prompt: string | null
  provider: string | null
  width: number | null
  height: number | null
  format: string | null
  isSelected: boolean
  createdAt: string
}

interface MetadataPackageResponse {
  id: string
  videoProjectId: string
  title: string
  description: string | null
  tags: string[]
  categoryId: string | null
  language: string
  madeForKids: boolean
  visibility: string
  scheduledPublishAt: string | null
  createdAt: string
  updatedAt: string
}
```

---

### QA and Review

#### POST /api/qa/run

Triggers a QA run on a video project. The project must be in `PREVIEW_RENDERED` status. Long-running.

**Request body:**
```typescript
interface RunQaRequest {
  videoProjectId: string
}
```

**Response:** `200 OK`
```typescript
type RunQaResponse = JobQueuedResponse
```

---

#### GET /api/qa/:videoProjectId/latest

Returns the latest QARun for a video project.

**Response:** `200 OK`
```typescript
interface QaRunResponse {
  id: string
  videoProjectId: string
  jobRunId: string | null
  decision: 'PASS' | 'REVIEW' | 'BLOCK' | null
  overallScore: number | null
  audioScore: number | null
  captionSyncScore: number | null
  visualScore: number | null
  durationScore: number | null
  reasonCodes: {
    pass: Array<{ code: string; message: string }>
    warnings: Array<{ code: string; message: string; beatIndex?: number }>
    blocks: Array<{ code: string; message: string }>
    decisionRationale: string
  } | null
  reviewerNotes: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
```

**Errors:**
- `404 NOT_FOUND` — no QARun exists for this project

---

#### POST /api/review/:videoId/approve

Approves a video project for export. The project must be in `REVIEW_READY` status.

**Request body:**
```typescript
interface ApproveVideoRequest {
  notes?: string
}
```

**Response:** `200 OK` — updated `VideoProjectResponse`

**Errors:**
- `422 CONFLICT` — project is not in `REVIEW_READY` status

---

#### POST /api/review/:videoId/reject

Rejects a video project without triggering rewrite. Leaves it in `REVIEW_READY` for further human decision.

**Request body:**
```typescript
interface RejectVideoRequest {
  reason: string
}
```

**Response:** `200 OK` — updated `VideoProjectResponse` with `notes` populated

---

#### POST /api/review/:videoId/request-rewrite

Requests a script rewrite, reverting the pipeline. Triggers `review.rewrite_requested` event. Long-running.

**Request body:**
```typescript
interface RequestRewriteRequest {
  instructions: string
}
```

**Response:** `200 OK`
```typescript
type RequestRewriteResponse = JobQueuedResponse
```

---

### Export

#### POST /api/packages/export

Triggers export of the video project to disk. The project must be in `APPROVED` status. Long-running.

**Request body:**
```typescript
interface ExportPackageRequest {
  videoProjectId: string
}
```

**Response:** `200 OK`
```typescript
type ExportPackageResponse = JobQueuedResponse
```

On job completion, `JobRun.resultId` is the `PublishPackage.id`.

---

#### GET /api/packages/:videoProjectId

Returns the PublishPackage for a video project, including the export folder path.

**Response:** `200 OK`
```typescript
interface PublishPackageResponse {
  id: string
  videoProjectId: string
  exportFolderPath: string | null
  videoFilePath: string | null
  thumbnailFilePath: string | null
  metadataJsonPath: string | null
  captionsPath: string | null
  status: string
  youtubeVideoId: string | null
  uploadedAt: string | null
  createdAt: string
  updatedAt: string
}
```

**Errors:**
- `404 NOT_FOUND` — no export package exists for this project

---

### Analytics

#### POST /api/analytics/sync

Persists an analytics snapshot for a video project. Call this when pulling fresh data from YouTube Analytics API.

**Request body:**
```typescript
interface AnalyticsSnapshotInput {
  videoProjectId: string
  snapshotDate: string                     // ISO 8601 date string, e.g. "2026-06-16"
  views: number
  likes: number
  comments: number
  shares: number
  watchTimeSeconds: number
  averageViewDurationSeconds: number
  averageViewPercentage: number
  impressions: number
  ctr: number
  revenueUsd?: number
}
```

**Response:** `201 Created`
```typescript
interface AnalyticsSnapshotResponse {
  id: string
  videoProjectId: string
  channelId: string
  snapshotDate: string
  views: number
  likes: number
  comments: number
  shares: number
  watchTimeSeconds: number
  averageViewDurationSeconds: number
  averageViewPercentage: number
  impressions: number
  ctr: number
  revenueUsd: number | null
  createdAt: string
}
```

**Errors:**
- `409 CONFLICT` — snapshot for this `videoProjectId` + `snapshotDate` already exists

---

#### GET /api/analytics/channel/:id

Returns aggregated analytics across all videos in a channel.

**Response:** `200 OK`
```typescript
interface ChannelAnalyticsResponse {
  channelId: string
  totalVideos: number
  totalViews: number
  totalLikes: number
  totalWatchTimeSeconds: number
  averageViewPercentage: number
  averageCtr: number
  topVideos: Array<{
    videoProjectId: string
    title: string
    views: number
    averageViewPercentage: number
    ctr: number
  }>
  snapshotDateRange: {
    earliest: string
    latest: string
  }
}
```

---

#### GET /api/analytics/video/:id

Returns all analytics snapshots for a single video project, ordered by date descending.

**Response:** `200 OK`
```typescript
interface VideoAnalyticsResponse {
  videoProjectId: string
  channelId: string
  snapshots: AnalyticsSnapshotResponse[]
}
```

---

### Jobs

#### GET /api/jobs/:id

Returns the current state of a job.

**Response:** `200 OK`
```typescript
interface JobRunResponse {
  id: string
  jobType: string
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  entityType: string | null
  entityId: string | null
  resultId: string | null
  errorCode: string | null
  errorMessage: string | null
  errorDetails: unknown | null
  logs: string | null
  queuedAt: string
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  createdAt: string
  updatedAt: string
}
```

**Errors:**
- `404 NOT_FOUND` — job does not exist

---

#### GET /api/jobs

Returns a list of recent jobs.

**Query parameters:**
```typescript
interface ListJobsQuery {
  status?: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  jobType?: string     // e.g. "script.generate"
  limit?: number       // default 50
}
```

**Response:** `200 OK`
```typescript
interface ListJobsResponse {
  data: JobRunResponse[]
}
```

---

## Async Job Contract

All long-running endpoints follow this pattern:

**Step 1: Initiate**

Client sends POST to the endpoint. Server queues the job immediately and returns `{ jobId, status: 'queued' }` with HTTP 200. The job begins executing asynchronously in the background.

**Step 2: Poll**

Client polls `GET /api/jobs/:id` on an interval (recommended: 2 seconds). The `JobRun.status` field transitions as:

```
QUEUED -> RUNNING -> COMPLETED
                  -> FAILED
```

**Step 3a: On COMPLETED**

`JobRun.status` is `'COMPLETED'`. The `resultId` field contains the CUID of the created or updated entity. Clients can use this to fetch the result:

```typescript
// Example: after script generation job completes
const job = await GET(`/api/jobs/${jobId}`)
// job.resultId is the ScriptPackage.id
const script = await GET(`/api/scripts/${job.resultId}`)
```

**Step 3b: On FAILED**

`JobRun.status` is `'FAILED'`. The `errorCode`, `errorMessage`, and `errorDetails` fields describe the failure. The `logs` field may contain additional diagnostic output.

```typescript
// Example failure response from GET /api/jobs/:id
{
  "id": "clx4m2k0d0001z9v8fk3a1b2d",
  "jobType": "voice.render",
  "status": "FAILED",
  "errorCode": "PROVIDER_TIMEOUT",
  "errorMessage": "ElevenLabs did not respond within 30 seconds",
  "errorDetails": { "provider": "elevenlabs", "timeoutMs": 30000 },
  "durationMs": 30012,
  "completedAt": "2026-06-16T10:01:30.012Z"
}
```

### Full TypeScript Job Polling Utility

```typescript
interface PollJobOptions {
  jobId: string
  intervalMs?: number    // default 2000
  timeoutMs?: number     // default 300000 (5 minutes)
}

interface CompletedJob {
  id: string
  status: 'COMPLETED'
  resultId: string
}

interface FailedJob {
  id: string
  status: 'FAILED'
  errorCode: string
  errorMessage: string
  errorDetails?: unknown
}

async function pollJob(options: PollJobOptions): Promise<CompletedJob | FailedJob> {
  const { jobId, intervalMs = 2000, timeoutMs = 300_000 } = options
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const res = await fetch(`/api/jobs/${jobId}`)
    const job: JobRunResponse = await res.json()

    if (job.status === 'COMPLETED') {
      return { id: job.id, status: 'COMPLETED', resultId: job.resultId! }
    }

    if (job.status === 'FAILED') {
      return {
        id: job.id,
        status: 'FAILED',
        errorCode: job.errorCode!,
        errorMessage: job.errorMessage!,
        errorDetails: job.errorDetails,
      }
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`)
}
```
