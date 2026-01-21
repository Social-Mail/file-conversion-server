/* eslint-disable no-console */
import { readFile, writeFile } from "fs/promises";
import convert from "heic-convert";

try {

    const output = await convert({
        buffer: await readFile(process.env.FILE_IN),
        format: "PNG"
    });

    await writeFile(process.env.FILE_OUT, output);

} catch (error) {
    console.error(error);
    process.exit(1);
}