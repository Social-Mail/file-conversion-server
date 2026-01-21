import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";

export default class FileInfo {


    public static from(file: LocalFile) {
        return new FileInfo(file.path, file.contentType, file.fileName);
    }

    constructor(public readonly path: string, public readonly contentType: string, public readonly fileName: string) {

    }
}