import path from "path";
import BaseDiskCache from "@entity-access/server-pages/dist/cache/BaseDiskCache.js";
import FileSize from "./FileSize.js";

const tmpdir = path.join("/fcs/cache", "t");

export const tempDiskCache = new BaseDiskCache({
    root: tmpdir,
    keepTTLSeconds: 1 * 60 * 60,
    minSize: FileSize.parse("20gb"),
    maxAge: 1
});
