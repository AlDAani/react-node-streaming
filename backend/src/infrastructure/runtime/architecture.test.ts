import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', 'src');
const RUNTIME_FILE = path.join(SRC_ROOT, 'infrastructure', 'runtime', 'create-server-runtime.ts');
const DOMAIN_DIR = path.join(SRC_ROOT, 'domain');
const APPLICATION_DIR = path.join(SRC_ROOT, 'application');
const ADAPTERS_DIR = path.join(SRC_ROOT, 'adapters');
const DISALLOWED_MIRROR_DIRS = [
  path.join(SRC_ROOT, 'modules'),
  path.join(SRC_ROOT, 'profiles'),
  path.join(SRC_ROOT, 'queue'),
  path.join(SRC_ROOT, 'stream-text'),
  path.join(SRC_ROOT, 'shared'),
  path.join(SRC_ROOT, 'runtime'),
  path.join(SRC_ROOT, 'config'),
  path.join(SRC_ROOT, 'contracts'),
  path.join(SRC_ROOT, 'app'),
  path.join(SRC_ROOT, 'errors'),
  path.join(SRC_ROOT, 'rate-limit'),
];

function listFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(target);
    }

    return [target];
  });
}

function listSourceFiles(dir: string): string[] {
  return listFiles(dir).filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'));
}

function parseImports(content: string): string[] {
  const imports: string[] = [];
  const importPattern = /from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null = importPattern.exec(content);
  while (match) {
    imports.push(match[1] ?? '');
    match = importPattern.exec(content);
  }

  return imports;
}

function resolveImport(fromFile: string, importPath: string): string | null {
  if (!importPath.startsWith('.')) {
    return null;
  }

  return path.resolve(path.dirname(fromFile), importPath);
}

function assertNoLayerImports(
  files: string[],
  disallowedSegments: string[],
  disallowedPackages: string[],
): void {
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const imports = parseImports(content);

    for (const imported of imports) {
      if (disallowedPackages.includes(imported)) {
        assert.fail(`${imported} import found in ${file}`);
      }

      const resolvedImport = resolveImport(file, imported);
      if (!resolvedImport) {
        continue;
      }

      for (const segment of disallowedSegments) {
        if (resolvedImport.includes(segment)) {
          assert.fail(`Layer boundary violation in ${file}: imports ${imported}`);
        }
      }
    }
  }
}

test('runtime create-server-runtime remains thin bootstrap', () => {
  const content = fs.readFileSync(RUNTIME_FILE, 'utf8');
  const lineCount = content.split('\n').length;

  assert.equal(lineCount < 150, true);
  assert.equal(content.includes('INVALID_CURSOR'), false);
  assert.equal(content.includes('INVALID_JOB_INPUT'), false);
});

test('legacy mirror folders are removed from src root', () => {
  for (const folder of DISALLOWED_MIRROR_DIRS) {
    assert.equal(fs.existsSync(folder), false, `unexpected legacy folder exists: ${folder}`);
  }
});

test('domain layer does not depend on application/adapters/infrastructure or transport frameworks', () => {
  const domainFiles = listSourceFiles(DOMAIN_DIR);

  assertNoLayerImports(
    domainFiles,
    ['/src/application/', '/src/adapters/', '/src/infrastructure/'],
    ['express', 'socket.io'],
  );
});

test('application layer does not depend on inbound adapters, infrastructure, or transport frameworks', () => {
  const applicationFiles = listSourceFiles(APPLICATION_DIR);

  assertNoLayerImports(
    applicationFiles,
    ['/src/adapters/inbound/', '/src/infrastructure/'],
    ['express', 'socket.io'],
  );
});

test('adapters layer can depend on application and domain', () => {
  const adapterFiles = listSourceFiles(ADAPTERS_DIR);
  const withCoreDependency = adapterFiles.filter((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const imports = parseImports(content);
    return imports.some((imported) => {
      const resolvedImport = resolveImport(file, imported);
      if (!resolvedImport) {
        return false;
      }

      return resolvedImport.includes('/src/application/') || resolvedImport.includes('/src/domain/');
    });
  });

  assert.equal(withCoreDependency.length > 0, true);
});
