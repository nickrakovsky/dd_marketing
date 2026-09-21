# Repair the saved Codex paths

Prepared on 15 September 2026 for the move from `/Users/joeybowie` to `/Users/work`.

## What to do

1. Open **macOS Terminal**, separately from the terminal inside Codex, and copy the command below into it. Wait to run it until step 2 is complete.
2. Finish any running tasks, then **quit ChatGPT completely with Command-Q**. Codex runs inside ChatGPT.app on this Mac. Also quit a separate Codex app or Codex command-line session if you have one open. Closing only a window is insufficient.
3. Run:

   ```sh
   /usr/bin/python3 "/Users/work/Work/dd_marketing/codex-path-repair/repair.py" --apply
   ```

4. Look for **“Repair applied; targeted path checks passed.”** Then reopen ChatGPT and try the chat that previously failed to resume.

The tool makes a dated backup before changing anything. It prints the backup location and an exact undo command. Keep Terminal's output until you have confirmed the chat works.

## If it stops

- **ChatGPT/Codex still running:** quit the named app and any standalone Codex command-line sessions, then rerun. If an app process persists after quitting, restart the Mac and run the command before opening ChatGPT.
- **Another error:** the tool stops instead of continuing through a failed check. Keep the error and backup location, reopen ChatGPT, and paste the output into this task.
- **The same chat still fails:** copy the new error into this task. Successful path checks alone cannot establish that the app has resumed the conversation successfully.

## Findings and repair scope

The missing file in the error exists at its corresponding path under `/Users/work/.codex/sessions/`. Its session ID matches the saved chat record. All 25 affected chat files were readable and contained valid JSON records at the time of inspection.

The repair updates only these verified types of stored references:

| Item | Affected count at inspection |
| --- | ---: |
| Chat history file locations | 25 |
| Chat working folders | 25 |
| Saved chat permission paths | 24 |
| Other project folders in the database | 3 |
| Corresponding app project folders | 3 |
| App folder/permission groups | 3 |
| Saved follow-up permission entries | 4 |
| Reciprocal Git worktree links | 2 |

Permission levels and restrictions remain the same; their old home-folder prefix is updated. The website project's saved folder is already correct. The worktree repair reconnects `/Users/work/.codex/worktrees/09ea/dd_marketing` with the existing repository at `/Users/work/Work/dd_marketing`.

The original conversation files, messages, historical prompts, and history indexes are preserved. Old path text can still appear in historical content. Obsolete project trust entries and app migration-cache keys are outside this repair; some already have separate entries for the new home folder, so a blanket text replacement would risk conflicts.

## Backup and undo

Backups go under:

`/Users/work/.codex/path-repair-backups/<date-and-time>/`

Each backup contains a consistent copy of `state_5.sqlite`, the original app settings file, any affected Git link files, and a manifest. These are local files and may contain private chat metadata. Nothing is uploaded.

The tool prints the exact restore command after a successful repair. Run it with ChatGPT/Codex closed. A restore returns these files to the state before repair, so use it before doing substantial new work in the app.

For a read-only check at any time:

```sh
/usr/bin/python3 "/Users/work/Work/dd_marketing/codex-path-repair/repair.py" --check
```

## Validation already completed

- Read-only inspection of the live records and replacement folders/files.
- Full repair on disposable copies of the current database, settings, and worktree links.
- Database integrity and the expected updated values after repair.
- Second run produces no further changes.
- Backup restoration reproduces the original database and file contents.
- Simulated interrupted file write rolls back the changes.
- Running-app check refuses to apply while ChatGPT is open.

The live repair has not been applied. End-to-end chat resumption remains the final user-side check after restarting the app.
