const { execSync } = require('child_process');
const { existsSync } = require('fs');

const args = process.argv.slice(2);
const cwd = process.cwd();

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit', shell: true });
    return 0;
  } catch (err) {
    return err.status || 1;
  }
}

// Run eslint CLI for lint-staged. Avoid calling `next lint` which can fail when Next's
// app/pages detection behaves differently in certain environments.
// NOTE: run eslint in --quiet mode during pre-commit so warnings don't block commits; only errors
// will fail the hook. Developers should still run full lint locally to see warnings.
const cmd = `npx eslint --fix --quiet ${args.map(a => `"${a}"`).join(' ')}`.trim();
process.exit(run(cmd));
