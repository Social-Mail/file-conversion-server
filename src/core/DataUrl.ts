export default class DataUrl {
    static from(buffer: Buffer, mimeType) {
        return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }
}