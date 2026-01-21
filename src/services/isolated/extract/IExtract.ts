export default interface IExtract {
    input: { contentType, fileName, path },
    output: {
        path: string,
    },
    useOcr: boolean;
}