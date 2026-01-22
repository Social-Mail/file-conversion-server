import path from "path";
import BaseDiskCache from "./BaseDiskCache.js";
import FileSize from "./FileSize.js";

const tmpdir = path.join("/fcs/cache", "t");

export const tempDiskCache = new BaseDiskCache({
    root: tmpdir,
    keepTTLSeconds: 4 * 60 * 60,
    minSize: FileSize.parse("10gb"),
    maxAge: 7,
    minAge: 0
});
