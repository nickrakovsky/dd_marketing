"""Exercise the repair on disposable copies, never on the live Codex state."""
import contextlib
import io
import json
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile
from unittest.mock import patch

import repair


def run():
    with tempfile.TemporaryDirectory(prefix='codex-path-repair-test-') as name:
        temp = Path(name)
        db = temp / 'state_5.sqlite'
        with repair.connect(repair.DB) as source, sqlite3.connect(db) as dest:
            source.backup(dest)
        global_file = temp / 'global-state.json'
        shutil.copyfile(repair.GLOBAL, global_file)
        link_files = (temp / 'worktree-link', temp / 'git-link')
        for source, dest in zip(repair.LINKS, link_files):
            shutil.copyfile(source, dest)
        before_global = json.loads(global_file.read_bytes())
        before_links = [p.read_bytes() for p in link_files]
        with sqlite3.connect(db) as conn:
            before_dump = '\n'.join(conn.iterdump())

        with patch.multiple(repair, ROOT=temp, DB=db, GLOBAL=global_file, LINKS=link_files):
            edits, _, counts = repair.plan()
            assert counts['chat rollout_path'] == 25
            # The production process guard must reject a running application.
            process = subprocess.CompletedProcess([], 0, '684 /Applications/ChatGPT.app/Contents/MacOS/ChatGPT\n', '')
            with patch.object(repair.subprocess, 'run', return_value=process):
                try:
                    repair.apply()
                except RuntimeError as error:
                    assert 'Quit ChatGPT' in str(error)
                else:
                    raise AssertionError('Running-app guard failed')
            assert not (temp / 'path-repair-backups').exists()

            # A failed verification of a relocated chat must stop planning.
            with patch.object(repair, 'verify_rollout', side_effect=RuntimeError('bad session ID')):
                try:
                    repair.plan()
                except RuntimeError:
                    pass
                else:
                    raise AssertionError('Missing/mismatched session guard failed')

            # Test the full write path only after redirecting all write targets above.
            with patch.object(repair, 'ensure_closed'), contextlib.redirect_stdout(io.StringIO()):
                repair.apply()
            assert repair.plan()[:2] == ([], [])
            with sqlite3.connect(db) as conn:
                for table, identity, field, before, after in edits:
                    where = ' AND '.join(k + '=?' for k in identity)
                    actual = conn.execute(f'SELECT {field} FROM {table} WHERE {where}',
                                          list(identity.values())).fetchone()[0]
                    assert actual == after
                assert conn.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
            after_global = json.loads(global_file.read_bytes())
            # Preserve historical prompts and existing migration keys, including collisions.
            for key in ('app-server-projects-migration-by-host',
                        'app-server-project-id-by-legacy-project-id-by-host'):
                assert before_global[key] == after_global[key]
            assert (before_global['electron-persisted-atom-state']['prompt-history'] ==
                    after_global['electron-persisted-atom-state']['prompt-history'])
            backups = list((temp / 'path-repair-backups').iterdir())
            assert len(backups) == 1
            with patch.object(repair, 'ensure_closed'), contextlib.redirect_stdout(io.StringIO()):
                repair.apply()
            assert len(list((temp / 'path-repair-backups').iterdir())) == 1

            repair.restore(backups[0])
            assert json.loads(global_file.read_bytes()) == before_global
            assert [p.read_bytes() for p in link_files] == before_links
            with sqlite3.connect(db) as conn:
                assert '\n'.join(conn.iterdump()) == before_dump

            # Simulate a mid-repair disk write failure and verify rollback.
            original_write = repair.atomic_write
            calls = [0]

            def fail_once(path, data):
                calls[0] += 1
                if calls[0] == 2:
                    raise OSError('simulated interrupted file write')
                original_write(path, data)

            with patch.object(repair, 'ensure_closed'), patch.object(repair, 'atomic_write', side_effect=fail_once):
                with contextlib.redirect_stdout(io.StringIO()):
                    try:
                        repair.apply()
                    except OSError:
                        pass
                    else:
                        raise AssertionError('Failure injection did not run')
            assert json.loads(global_file.read_bytes()) == before_global
            assert [p.read_bytes() for p in link_files] == before_links
            with sqlite3.connect(db) as conn:
                assert '\n'.join(conn.iterdump()) == before_dump
    print('PASS: copied-state repair, verification, repeat run, backup restoration, failure rollback, and running-app guard.')


if __name__ == '__main__':
    run()
