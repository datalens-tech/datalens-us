import * as fs from 'fs';
import * as path from 'path';

import type {initDB} from '../init-db';

export function findRepoRoot(): string {
    let dir = process.cwd();
    while (dir !== path.dirname(dir)) {
        const pkgPath = path.join(dir, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (pkg.name === 'united-storage') {
                return dir;
            }
        }
        dir = path.dirname(dir);
    }
    throw new Error('Could not find repo root (package.json with name "united-storage")');
}

export type CheckMigrationsResult = {ok: boolean; message: string};

export async function checkMigrations({
    db,
    migrationsSourceDir,
    migrationsTable,
}: {
    db: ReturnType<typeof initDB>['db'];
    migrationsSourceDir: string;
    migrationsTable: string;
}): Promise<CheckMigrationsResult> {
    const repoRoot = findRepoRoot();
    const migrationsDir = path.resolve(repoRoot, migrationsSourceDir);

    const sourceFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.ts'))
        .sort();

    if (sourceFiles.length === 0) {
        return {ok: false, message: `No migration files found in ${migrationsSourceDir}`};
    }

    const applied = await db.primary(migrationsTable).select('name').orderBy('id', 'asc');
    const appliedNames = applied.map((r: {name: string}) => r.name);
    const appliedSet = new Set(appliedNames);

    const expectedOrder = [...appliedNames].sort();
    for (let i = 0; i < appliedNames.length; i++) {
        if (appliedNames[i] !== expectedOrder[i]) {
            return {
                ok: false,
                message: `Migration order mismatch in ${migrationsSourceDir}: expected ${expectedOrder[i]}, but found ${appliedNames[i]} in database.`,
            };
        }
    }

    const pending = sourceFiles.filter((f) => {
        const jsName = f.replace(/\.ts$/, '.js');
        return !appliedSet.has(jsName);
    });

    if (pending.length > 0) {
        const fileList = pending.map((f) => `  - ${f}`).join('\n');
        return {
            ok: false,
            message: `There are ${pending.length} pending migration(s) in ${migrationsSourceDir}:\n${fileList}`,
        };
    }

    const lastFile = sourceFiles[sourceFiles.length - 1];
    return {
        ok: true,
        message: `All migrations in ${migrationsSourceDir} are up to date (last: ${lastFile}).`,
    };
}
