import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Run only against the disposable Compose project created by CI.
if (process.env.CI !== 'true') throw new Error('This check requires a disposable CI environment.');
const id = 'ci-persistence-check';
if (process.argv[2] === 'seed') {
  const code = `import Database from 'better-sqlite3';
    const db = new Database(process.env.DING_DB_PATH);
    db.prepare('INSERT INTO announcements (id,title,body,status,published_at) VALUES (?,?,?,?,?)')
      .run('${id}','Persistence check','This exact record must survive restart.','published',new Date().toISOString());
    db.close();`;
  execFileSync('docker', ['compose', 'exec', '-T', 'ding', 'node', '--input-type=module', '-e', code], { stdio: 'inherit' });
}
let lastError;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/announcements', { signal: AbortSignal.timeout(2000) });
    assert.equal(response.status, 200);
    const { announcements } = await response.json();
    const record = announcements.find((item) => item.id === id);
    assert.equal(record?.title, 'Persistence check');
    assert.equal(record?.body, 'This exact record must survive restart.');
    console.log('Verified the same published announcement through the public API.');
    process.exit(0);
  } catch (error) { lastError = error; }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
throw lastError;
