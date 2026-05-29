import * as fs from 'fs';
import * as path from 'path';

import dotenv from 'dotenv';
dotenv.config();

import '../../index';
import {registry} from '../../registry';

const MIGRATIONS_SOURCE_DIR = 'projects/opensource/src/db/migrations';
const MIGRATIONS_TABLE = 'migrations';

function findRepoRoot(): string {
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

if (require.main === module) {
    const {db} = registry.getDbInstance();

    (async function () {
        try {
            await db.ready();

            const repoRoot = findRepoRoot();
            const migrationsDir = path.resolve(repoRoot, MIGRATIONS_SOURCE_DIR);

            const sourceFiles = fs
                .readdirSync(migrationsDir)
                .filter((f) => f.endsWith('.ts'))
                .sort();

            if (sourceFiles.length === 0) {
                console.error(`No migration files found in ${MIGRATIONS_SOURCE_DIR}`);
                process.exit(1);
            }

            const applied = await db.primary(MIGRATIONS_TABLE).select('name');
            const appliedSet = new Set(applied.map((r: {name: string}) => r.name));

            const pending = sourceFiles.filter((f) => {
                const jsName = f.replace(/\.ts$/, '.js');
                return !appliedSet.has(jsName);
            });

            if (pending.length > 0) {
                console.error(
                    `There are ${pending.length} pending migration(s) in ${MIGRATIONS_SOURCE_DIR}:`,
                );
                for (const file of pending) {
                    console.error(`  - ${file}`);
                }
                process.exit(1);
            }

            const lastFile = sourceFiles[sourceFiles.length - 1];
            console.info(
                `All migrations in ${MIGRATIONS_SOURCE_DIR} are up to date (last: ${lastFile}).`,
            );
            process.exit(0);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    })();
}
