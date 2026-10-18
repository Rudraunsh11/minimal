# Checkpoint 3 — Storage growth

18 October 2026. Implemented for a bounded initial release. Checkpoints 1 and 2 retain their stated validation limits. Checkpoint 4 has not started.

## Policy and behavior

Active state stays capped at 900,000 UTF-8 JSON bytes. Settings shows usage, with proactive warnings at 70% and 85%. Invalid/oversized edits are rejected before replacing saved records; permanent server save rejection preserves the pending copy and stops automatic retry until an explicit retry or a new edit. Counts and bytes are bounds, not promised lifetime capacity.

Nothing is pruned on a schedule. A signed-in user can preview and confirm moving food and water logs before a chosen cutoff to an online archive. Current-month logs are protected. Only food and water move; notes, drafts, tasks, training, focus, habit checks, routines and rewards remain unchanged. Archived nutrition/portions/source fields remain exact. Archive views paginate 50 entries; lists return metadata without payloads. Archives are read-only; daily-diary editing/restoration of archived entries is not implemented.

Archives are stored in D1, scoped to trusted account identity. At most ten archive chunks per account are accepted. Each chunk derives from a validated active snapshot of at most 900 KB. Active and previous snapshots plus archives are therefore bounded to about 10.8 MB of JSON per account, excluding SQLite/index/row overhead and rate counters. This is not a global service-capacity guarantee; aggregate quotas and operations remain checkpoint 5. Large note/task/training histories can still hit the active limit. Future normalized record storage and archive editing/compaction are appropriate before promising unlimited retention.

Creating an archive and reducing active state happen in one D1 transaction with revision checks. Concurrent writes, a full archive quota or a transaction failure cannot silently remove source history. Older device tabs encounter the existing revision conflict flow. Recovered previous snapshots may reintroduce logs already present in an archive; archives are immutable and neither copy is silently deleted.

Normal backup export includes active records only; separate archive download is available and marked clearly. Archives are not independent backups. Account erasure transactionally removes current/previous state and online archives. No archive content is added to GitHub.

## Evidence

The new migration was generated with Drizzle and applied to the local D1 preview. Tests use the actual generated schema in SQLite with transactional batch behavior. They cover account/origin binding, private archive reads, cutoff validation, stale revisions, empty selections, exact preservation, metadata-only listing, transactional rollback, quota rejection, account-scoped erasure, in-flight edit locks and permanent save-error behavior. Existing security/privacy/food regressions remain required.

Three-year replay: 1,095 days, 6,570 food entries and 8,760 water entries. Unarchived state: 2,710,175 bytes, exceeding the active cap. With six manually simulated half-year archive batches, peak active state was 517,535 bytes and final state 74,930 bytes. Every log, portion and nutrient field matched exactly across active records and archives. Validation timings are recorded in .test-results/storage-growth-results.json (also copied to outputs/storage-growth-results.json in this workspace); these Node/SQLite measurements are not phone benchmarks or hosted D1 load results.

Local browser QA created a single synthetic historical water entry, synced it, previewed/confirmed an archive, opened its list and read the retained entry. No personal hosted history was moved. Broader hosted multi-account/load and real-device testing remain release gates.
