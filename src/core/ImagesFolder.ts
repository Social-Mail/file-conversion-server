import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const metaDir = fileURLToPath(dirname(import.meta.url));

class PackageFolder {
    constructor(public readonly folder: string) {

    }

    file(... names) {
        return join(this.folder, ... names);
    }

    localFile(... names) {
        const path= join(this.folder, ... names);
        return new LocalFile(path, names.pop(), void 0, () => void 0);
    }
}

export const ImagesFolder = new PackageFolder(join(metaDir, "..", "..", "images"));

export const contentFolder = new PackageFolder(join(metaDir, "..", "..", "content"));
