process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = '1';

const { spawn } = require('child_process');
const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
	stdio: 'inherit',
	env: process.env,
});

child.on('exit', (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exit(code ?? 1);
});
