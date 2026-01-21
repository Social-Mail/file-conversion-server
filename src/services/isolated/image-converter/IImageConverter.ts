export default interface IImageConverter {
    type: string;
    input: { path: string; },
    output: { path: string;},
    outputFileName: string;
}