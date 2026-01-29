const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const CONTAINERS_METADATA_PATH = path.join(__dirname, 'containers-metadata.json');

module.exports = async () => {
    console.log('[Global Teardown] Stopping all containers...');

    try {
        if (global.__TESTCONTAINERS_ALL_CONTAINERS__) {
            const containers = global.__TESTCONTAINERS_ALL_CONTAINERS__;
            console.log(
                `[Global Teardown] Stopping ${containers.length} containers from global references...`,
            );
            await Promise.all(
                containers.map(async (container) => {
                    try {
                        await container.stop();
                    } catch (error) {
                        console.error(`[Global Teardown] Error stopping container:`, error.message);
                    }
                }),
            );
            delete global.__TESTCONTAINERS_ALL_CONTAINERS__;
        }

        // Also stop containers by name using Docker CLI (fallback)
        if (fs.existsSync(CONTAINERS_METADATA_PATH)) {
            const containersMetadata = JSON.parse(
                fs.readFileSync(CONTAINERS_METADATA_PATH, 'utf-8'),
            );

            const stopPromises = Object.entries(containersMetadata).map(
                async ([workerId, metadata]) => {
                    try {
                        const {name} = metadata;
                        // Use Docker CLI to stop and remove container by name
                        try {
                            execSync(`docker stop ${name} 2>/dev/null || true`, {stdio: 'ignore'});
                            execSync(`docker rm ${name} 2>/dev/null || true`, {stdio: 'ignore'});
                            console.log(`[Global Teardown] Container ${name} stopped and removed.`);
                        } catch (error) {
                            // Container may already be stopped
                            console.log(
                                `[Global Teardown] Container ${name} may already be stopped.`,
                            );
                        }
                    } catch (error) {
                        console.error(
                            `[Global Teardown] Error stopping container for worker ${workerId}:`,
                            error.message,
                        );
                    }
                },
            );

            await Promise.all(stopPromises);

            // Clean up metadata file
            fs.unlinkSync(CONTAINERS_METADATA_PATH);
        } else {
            console.log('[Global Teardown] No containers metadata file found.');
        }

        console.log('[Global Teardown] All containers stopped and cleaned up.');
    } catch (error) {
        console.error('[Global Teardown] Error during teardown:', error);
        // Try to clean up metadata file even if there was an error
        if (fs.existsSync(CONTAINERS_METADATA_PATH)) {
            try {
                fs.unlinkSync(CONTAINERS_METADATA_PATH);
            } catch (unlinkError) {
                // Ignore cleanup errors
            }
        }
    }
};
