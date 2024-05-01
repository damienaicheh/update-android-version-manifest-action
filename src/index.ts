import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';

process.on('unhandledRejection', handleError)
main().catch(handleError)

async function main(): Promise<void> {
    try {
        let printFile = getBooleanInput('print-file');
        let androidManifestPath = core.getInput('android-manifest-path');

        if (!fs.existsSync(androidManifestPath)) {
            core.setFailed(`The file path for the AndroidManifest.xml does not exist or is not found: ${androidManifestPath}`);
            process.exit(1);
        }

        let versionCode = core.getInput('version-code');

        if (!versionCode) {
            core.setFailed(`Version Code has no value: ${versionCode}`);
            process.exit(1);
        } else if (parseInt(versionCode, 0) <= 0 && parseInt(versionCode, 10) >= 2100000000) {
            core.setFailed(`The Version Code you set: ${versionCode} is not valid, to submit your application to the Google Play Store the value must 
            be greater then 0 and below 2100000000 of ${versionCode}`);
            process.exit(1);
        }

        let versionName: string = core.getInput('version-name');

        if (printFile) {
            core.info('Before update:');
            await exec.exec('cat', [androidManifestPath]);
        }

        let filecontent = fs.readFileSync(androidManifestPath).toString();
        fs.chmodSync(androidManifestPath, "600");

        filecontent = filecontent.replace(/versionCode\s*=\s*"(\d+(?:\.\d)*)"/mg, `versionCode=\"${versionCode}\"`);
        filecontent = filecontent.replace(/versionName\s*=\s*"(\d+(?:\.\d+)*)"/mg, `versionName=\"${versionName}\"`);

        fs.writeFileSync(androidManifestPath, filecontent);

        if (printFile) {
            core.info('After update:');
            await exec.exec('cat', [androidManifestPath]);
        }

        core.info(`AndroidManifest.xml updated successfully with versionCode: ${versionCode} and versionName: ${versionName}`);
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed(`Unhandled error: ${error}`);
        }
    }
}

function handleError(err: any): void {
    console.error(err)
    core.setFailed(`Unhandled error: ${err}`)
}

function getBooleanInput(inputName: string, defaultValue: boolean = false): boolean {
    return (core.getInput(inputName) || String(defaultValue)).toUpperCase() === 'TRUE';
}