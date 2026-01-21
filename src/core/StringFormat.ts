export default class StringFormat {

    static fixed(n: number, max = 2) {
        const t = n.toString();
        const pad = max - t.length;
        if (pad > 0) {
            return t.padStart(pad, "0");
        }
        return t;
    }

    static toCamelCase(dashed: string) {
        return dashed.replace(/-./g, (x) =>x[1].toUpperCase());
    }

}