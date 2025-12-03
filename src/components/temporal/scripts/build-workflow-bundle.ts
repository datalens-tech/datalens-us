import {writeFile} from 'node:fs/promises';
import path from 'node:path';

import {bundleWorkflowCode} from '@temporalio/worker';

/**
    Use:
    npx ts-node ./build-workflow-bundle.ts \
        workflowsPath="../src/components/temporal/workflows" \
        bundlePath="../dist/server/components/temporal/workflow-bundle.js"
*/

type ScriptArgs = {
    workflowsPath: string;
    bundlePath: string;
};

const buildWorkflowBundle = async (): Promise<void> => {
    const scriptArgs: ScriptArgs = {
        workflowsPath: '../workflows',
        bundlePath: '../../../../dist/server/components/temporal/workflow-bundle.js',
    };

    process.argv.slice(2).forEach((val) => {
        const [key, ...valueArr] = val.split('=');
        const value = valueArr.join('=');
        if (key in scriptArgs) {
            scriptArgs[key as keyof ScriptArgs] = value;
        }
    });

    const {code} = await bundleWorkflowCode({
        workflowsPath: require.resolve(scriptArgs.workflowsPath),
    });

    const bundlePath = path.join(__dirname, scriptArgs.bundlePath);

    await writeFile(bundlePath, code);
    console.log(`Bundle written to ${bundlePath}`);
};

buildWorkflowBundle().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
