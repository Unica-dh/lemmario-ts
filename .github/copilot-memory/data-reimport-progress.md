## Progress on Data Re-import

### Status: In Progress

### Issue
- User reports duplicates in backend
- Missing rationality levels (livelli di razionalità)
- Sources (fonti) not properly associated with lemmas

### Root Cause Analysis
1. **Livelli di Razionalità**: Collection exists but is empty (0 docs). Access control requires authentication for create operations
2. **Current data**: 234 lemmi, 83 fonti, 430 definizioni, 555 ricorrenze - but no livelli records
3. **Definitions** have `livello_razionalita` field but it was being set as a number instead of relationship ID

### Actions Taken
1. ✅ Created `seed-livelli-razionalita.ts` script
2. ✅ Created `reset-database.ts` script
3. ✅ Updated `import.ts` to load and use livelli relationships
4. ✅ Added new npm scripts: `seed:livelli`, `reset:db`, `migrate:full`
5. ✅ Created `import-full.sh` bash wrapper script

### Current Blocker
- Access control prevents API-based creation of livelli-razionalita
- Need to either:
  a) Temporarily modify access control to allow public create
  b) Use Payload SDK directly instead of REST API
  c) Run seed through admin panel

### Next Steps
1. Temporarily set `create: () => true` for livelli-razionalita collection
2. Run seed:livelli
3. Run full migration
4. Restore access control
5. Generate and review migration report

### Files Modified
- `/scripts/migration/seed-livelli-razionalita.ts` (created)
- `/scripts/migration/reset-database.ts` (created)  
- `/scripts/migration/import.ts` (updated to use livelli map)
- `/scripts/migration/types.ts` (added livelli stats)
- `/scripts/package.json` (added new scripts)
- `/scripts/import-full.sh` (created)

