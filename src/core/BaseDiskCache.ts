/* eslint-disable no-console */
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import ensureDir from "./FileApi.js";
import fsp, { rm, rmdir, stat, unlink } from "node:fs/promises";
import { existsSync, Stats } from "node:fs";
import { join, parse } from "node:path";
import { randomUUID } from "node:crypto";
import EntityAccessError from "@entity-access/entity-access/dist/common/EntityAccessError.js";
import { toKMBString } from "./NumberFormats.js";
import { spawnPromise } from "./spawnPromise.js";
import TempFolder from "@entity-access/server-pages/dist/core/TempFolder.js";
import LockFile from "./LockFile.js";
import sleep from "./sleep.js";

const doNothing = () => void 0;

export interface IDiskCacheContainer {
    cache: BaseDiskCache;
}

export default class BaseDiskCache {

    createTempFile(fileName: string, mimeType?: string) {
        const folder = join(this.root, randomUUID());
        ensureDir(folder);
        const path = join(folder, fileName);
        return new LocalFile(path, fileName, mimeType, () => this.deleteFile(path).catch(console.error));
    }

    protected readonly root: string;
    protected readonly keepTTLSeconds: number;
    protected readonly minSize: number;
    protected readonly updateAccessTime: boolean;
    protected readonly maxAge: number;
    protected readonly minAge: number;
    constructor(
        {
            root,
            keepTTLSeconds = 3600,
            minSize = Number.MAX_SAFE_INTEGER,
            updateAccessTime = true,
            maxAge = 1,
            minAge = 1
        }: {
            root: string;
            keepTTLSeconds?: number;
            minSize?: number;
            updateAccessTime?: boolean;
            maxAge?: number;
            minAge?: number;
        }
    ) {
        this.root = root;
        this.keepTTLSeconds = keepTTLSeconds;
        this.minSize = minSize;
        this.updateAccessTime = updateAccessTime;
        this.maxAge = maxAge;
        this.minAge = minAge;
        ensureDir(root);
        // eslint-disable-next-line no-console
        setTimeout(() => this.clean().catch(console.error), 1000);
    }

    newFolder(suffix = "") {
        return new TempFolder(suffix, this.root);
    }

    async get(path: string) {
        path = join(this.root, path);
        if (existsSync(path)) {
            if(this.updateAccessTime) {
                const now = new Date();
                await fsp.utimes(path, now, now);
            }
            return new LocalFile(path, void 0, void 0, doNothing);
        }
    }

    async clear() {
        try {
            const path = this.root;
            using _lock = await LockFile.lock(`df-clear:${path}`);
            if (!existsSync(path)) {
                return;
            }
            const stalePath = `${path}.old.${Date.now()}`;
            await spawnPromise("mv",[path, stalePath]);
            ensureDir(this.root);
            rm(stalePath, { recursive: true, force: true}).catch(console.error);
        } catch (error) {
            console.error(error);
        }
    }

    async clearFolder(path: string) {
        try {
            using _lock = await LockFile.lock(`df-clear:${path}`);
            path = join(this.root, path);
            if (!existsSync(path)) {
                return;
            }
            const stalePath = `${path}.old.${Date.now()}`;
            await spawnPromise("mv",[path, stalePath]);
            rm(stalePath, { recursive: true, force: true}).catch(console.error);
        } catch (error) {
            console.error(error);
        }
    }

    async getOrCreateJsonAsync<T>(path: string, factory: () => Promise<T>) {
        const localFile = await this.getOrCreateAsync(path, async (lf) => {
            const data = (await factory()) ?? null;
            await lf.writeAllText(JSON.stringify(data));
        });
        const text = await localFile.readAsText();
        return JSON.parse(text) as T;
    }

    deleteAt(path: string) {
        path = join(this.root, path);
        return unlink(path);
    }

    async getOrCreateAsync(path: string, factory: (fx: LocalFile) => Promise<void>, ext = ".dat") {
        path = join(this.root, path);

        const parsedPath = parse(path);
        ensureDir(parsedPath.dir);

        let error: Error;

        for (let index = 0; index < 5; index++) {
            if (existsSync(path)) {
                if(this.updateAccessTime) {
                    const now = new Date();
                    await fsp.utimes(path, now, now);
                }
                return new LocalFile(path, void 0, void 0, doNothing);
            }

            using _lock = await LockFile.lock(`df:${path}`);

            if (existsSync(path)) {
                return new LocalFile(path, void 0, void 0, doNothing);
            }

            const tmpPath = join(this.root, randomUUID() + (parsedPath.ext || ext));

            await factory(new LocalFile(tmpPath, void 0, void 0, doNothing));

            try {
                ensureDir(parsedPath.dir);
                await fsp.rename(tmpPath, path);
            } catch (e) {

                if (existsSync(tmpPath)) {
                    unlink(tmpPath).catch(doNothing);
                }

                error = e;
                await sleep(1000);
                continue;
            }
            return new LocalFile(path, void 0, void 0, doNothing);
        }

        throw new EntityAccessError(`Failed to write file due to error ${error.stack ?? error}`);
    }

    createTempFileDeleteOnExit(pathFragments: string[], name: string, contentType: string) {
        const fileName = pathFragments.pop();
        if (pathFragments.length) {
            const folder = join(this.root, ... pathFragments);
            ensureDir(folder);
        }
        const path = join(this.root, ... pathFragments, fileName);
        return new LocalFile(path, name, contentType, () => this.deleteFile(path).catch(console.error));
    }

    protected async deleteFile(path: string) {
        if (!path.startsWith(this.root)) {
            return;
        }
        if (existsSync(path)) {
            await unlink(path);
        }
        for(;;) {
            const parsed = parse(path);
            if (parsed.dir === this.root) {
                break;
            }
            path = parsed.dir;
            try {
                if (existsSync(path)) {
                    // check if folder is empty...
                    await rmdir(path);
                }
            } catch (error) {
                // do nothing
                if (/directory not empty/i.test(error.stack)) {
                    return;
                }
                console.error(error);
                return;
            }
        }
    }

    protected async clean() {

        const start = Date.now();

        using l = await LockFile.lock("clean-" + this.root, 10000, 1000, false);

        if (!l.locked) {
            setTimeout(() => this.clean().catch(console.error), 60000);
            return;
        }

        let total = 0;

        const min = this.minAge;

        for(let i=this.maxAge;i>= min;i--) {
            const s = await fsp.statfs(this.root);
            const freeSize = s.bavail * s.bsize;

            if (freeSize < this.minSize) {
                try {
                    const keep = Date.now() - this.keepTTLSeconds * 1000 * i;
                    const files = await this.getFilesToDelete(keep);

                    for (const file of files) {
                        await this.deleteFile(file.path);
                        total += file.statInfo.size;
                    }

                } catch (error) {
                    console.error(error);
                }
            }
        }

        if (total) {
            console.log(`${this.root} cleaned, ${toKMBString(total)} freed in ${Date.now()-start}ms.`);
        }

        setTimeout(() => this.clean().catch(console.error), 60000);

    }

    private async getFilesToDelete(oldest: number) {
        const dir = await fsp.opendir(this.root, { recursive: true });
        const filesToDelete = [] as { path: string, statInfo: Stats }[];
        try {
            for await (const entry of dir) {
                if (!entry.isFile()) {
                    continue;
                }
                const path = join(entry.parentPath, entry.name);
                try {
                    const statInfo = await stat(path);
                    if (statInfo.ctimeMs < oldest) {
                        filesToDelete.push({ path, statInfo });
                        if (filesToDelete.length === 1000) {
                            break;
                        }
                    }
                } catch (error) {
                    // file may not exist anymore...
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            try {
                await dir.close();
            } catch {
                // do nothing
            }
        }
        return filesToDelete;
    }


}