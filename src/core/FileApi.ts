import { existsSync, mkdirSync } from "fs";

export default function ensureDir(folder: string) {

    if (existsSync(folder)) {
        return;
    }

    try {
        mkdirSync(folder, { recursive: true});
    } catch (error) {
        if (existsSync(folder)) {
            return;
        }
        console.error(error);
        throw error;
    }

}