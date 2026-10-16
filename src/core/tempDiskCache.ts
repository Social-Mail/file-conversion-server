import path, { join, parse } from "path";
import BaseDiskCache from "@entity-access/server-pages/dist/cache/BaseDiskCache.js";
import FileSize from "./FileSize.js";
import { randomUUID } from "crypto";
import ensureDir from "./FileApi.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import globalEnv from "../globalEnv.js";

const tmpdir = path.join("/fcs/cache", "t");

export const tempDiskCache = new BaseDiskCache({
    root: tmpdir,
    keepTTLSeconds: 4 * 60 * 60,
    minSize: FileSize.parse("20gb"),
    maxAge: 1
});

export class JobFolder {

    static create() {
        return JobFolder.from(randomUUID());
    }

    static from(id: string) {
        const folder = globalEnv.jobsFolder + "/" + id;
        ensureDir(folder);
        return new JobFolder(id, folder);
    }

    constructor(public id: string, private readonly folder: string) {
    }

    get(path: string) {
        const fp = join(this.folder, path);
        const { base } = parse(fp);
        return  new LocalFile(fp, base, void 0, () => void 0);
    }

}