import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Normalize CRLF (Windows checkouts) to LF so line-based parsing is platform-stable.
const workflow = readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n');
const checkStep = workflow.split('      - name: Check GitHub Pages availability\n')[1]
  .split('      - name: Configure GitHub Pages\n')[0];
const checkScript = checkStep.split('        run: |\n')[1]
  .split('\n').map((line: string): string => line.slice(10)).join('\n');

function runCheck(httpStatus: string, curlExit: number = 0): {
  status: number | null;
  stdout: string;
  output: string;
  summary: string;
} {
  const directory = mkdtempSync(join(tmpdir(), 'kaiser-pages-test-'));
  const output = join(directory, 'output');
  const summary = join(directory, 'summary');
  try {
    const result = spawnSync('bash', ['-e', '-c', `
      touch "$GITHUB_OUTPUT" "$GITHUB_STEP_SUMMARY"
      curl() { printf '%s' "$MOCK_HTTP_STATUS"; return "$MOCK_CURL_EXIT"; }
      ${checkScript}
    `], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: summary,
        GITHUB_API_URL: 'https://api.github.com',
        GITHUB_REPOSITORY: 'owner/repository',
        GITHUB_TOKEN: '',
        MOCK_HTTP_STATUS: httpStatus,
        MOCK_CURL_EXIT: String(curlExit)
      }
    });
    return {
      status: result.status,
      stdout: result.stdout,
      output: readFileSync(output, 'utf8'),
      summary: readFileSync(summary, 'utf8')
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

// The availability check script is executed through bash, which only the CI runner (ubuntu-latest) provides.
const isUnixLike = process.platform === 'linux' || process.platform === 'darwin';

describe.skipIf(!isUnixLike)('GitHub Pages deployment availability', () => {
  it('publishes when Pages is already configured', () => {
    const result = runCheck('200');
    expect(result.status).toBe(0);
    expect(result.output).toBe('enabled=true\n');
    expect(result.summary).toBe('');
  });

  it('keeps the artifact fallback and explains missing owner setup for a missing site', () => {
    const result = runCheck('404');
    expect(result.status).toBe(0);
    expect(result.output).toBe('enabled=false\n');
    expect(result.stdout).toContain('::warning::');
    expect(result.summary).toContain('kaiser-https-site');
    expect(result.summary).toContain('no live site was deployed');
  });

  it.each(['401', '403', '429', '500'])('fails on unexpected HTTP %s instead of hiding errors', (status: string) => {
    const result = runCheck(status);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(`::error::GitHub Pages availability check failed (HTTP ${status})`);
    expect(result.output).toBe('');
  });

  it('fails on network errors', () => {
    const result = runCheck('000', 7);
    expect(result.status).toBe(7);
    expect(result.output).toBe('');
  });
});

describe('deploy-pages workflow structure', () => {
  it('has a single Pages publisher so a source-only site cannot overwrite the game', () => {
    const directory = new URL('../.github/workflows/', import.meta.url);
    const publishers = readdirSync(directory).filter(name => /\.ya?ml$/.test(name))
      .filter(name => readFileSync(new URL(name, directory), 'utf8').includes('uses: actions/deploy-pages@'));
    expect(publishers).toEqual(['deploy-pages.yml']);
  });
  it('gates every publishing action, but not the fallback artifact, on Pages availability', () => {
    for (const action of ['configure-pages', 'upload-pages-artifact', 'deploy-pages']) {
      expect(workflow).toContain(
        `        if: steps.pages.outputs.enabled == 'true'\n        uses: actions/${action}@`
      );
    }
    expect(workflow).not.toContain('enablement: true');
    expect(workflow.indexOf('name: kaiser-https-site')).toBeLessThan(
      workflow.indexOf('name: Check GitHub Pages availability')
    );
    expect(workflow).not.toContain('continue-on-error');
  });
});
