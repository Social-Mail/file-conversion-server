import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";

export class FileType {

    static isCode({ fileName, contentType}: Partial<LocalFile>) {
        return /\.(htm|html|js|json|md|txt|c|cs|java|php|python|ts|ps|bat|xml|css|less|sass|svg)$/i.test(fileName);
    }

    static isXml({ fileName, contentType}: Partial<LocalFile>) {
        return /\.(svg|xml)$/i.test(fileName) || /xml/i.test(contentType);
    }

    static isDocument({ fileName}: Partial<LocalFile>) {
        return /\.(docx|docm|pptx|pptm|xlsx|xlsm|doc|xls|pdf|ppt|dot|xlst|sxw|sxc|sxd|sxi|sxm|sxg)$/i.test(fileName);
    }

    static isTextFile (file: Partial<LocalFile>) {
        return this.isCode(file)
            || this.isXml(file)
            || /^(text|message)\//.test(file.contentType);
    };

    static canBeCompressed(file: Partial<LocalFile>) {
        return this.isTextFile(file) || this.isDocument(file);
    }

    static isPdf(file: Partial<LocalFile>) {
        return /pdf/i.test(file.contentType)
            || /\.pdf$/i.test(file.fileName);
    }

    static isHtml(file: Partial<LocalFile>) {
        return /html/i.test(file.contentType)
            || /\.html$/i.test(file.fileName);
    }

    static isImage(file: Partial<LocalFile>) {
        return /^image\//i.test(file.contentType);
    }

    static isMedia(file: Partial<LocalFile>) {
        return /^(audio|video)\//i.test(file.contentType);
    }

}
