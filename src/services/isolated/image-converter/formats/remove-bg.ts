/* eslint-disable no-bitwise */
import sharp from "sharp";

import fs from "fs";
import path from "path";
import ort from "onnxruntime-node";

const INPUT_SIZE = 320;

function pickOutputTensor(outputs) {
  const keys = Object.keys(outputs);
  if (keys.length === 0) {
    throw new Error("Model returned no output tensors.");
  }
  return outputs[keys[0]];
}

function shouldInvertMask(normalized, width, height) {
  const border = 10;
  let borderSum = 0;
  let borderCount = 0;
  let centerSum = 0;
  let centerCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const value = normalized[idx];
      const isBorder =
        x < border || y < border || x >= width - border || y >= height - border;
      const isCenter =
        x > width * 0.3 && x < width * 0.7 && y > height * 0.3 && y < height * 0.7;

      if (isBorder) {
        borderSum += value;
        borderCount += 1;
      }
      if (isCenter) {
        centerSum += value;
        centerCount += 1;
      }
    }
  }

  const borderMean = borderCount ? borderSum / borderCount : 0;
  const centerMean = centerCount ? centerSum / centerCount : 0;
  return borderMean > centerMean;
}

function normalizeMask(maskData, width, height, threshold) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < maskData.length; i += 1) {
    const val = maskData[i];
    if (val < min) min = val;
    if (val > max) max = val;
  }

  const range = Math.max(max - min, 1e-6);
  const normalized = new Float32Array(maskData.length);
  for (let i = 0; i < maskData.length; i += 1) {
    normalized[i] = (maskData[i] - min) / range;
  }

  const invert = shouldInvertMask(normalized, width, height);
  const alpha = new Uint8ClampedArray(maskData.length);
  for (let i = 0; i < maskData.length; i += 1) {
    const value = invert ? 1 - normalized[i] : normalized[i];
    const contrasted = Math.min(
      1,
      Math.max(0, (value - threshold) / Math.max(1 - threshold, 1e-6)),
    );
    alpha[i] = Math.round(contrasted * 255);
  }

  return alpha;
}

function getDebugPath(outputPath, suffix) {
  const outputDir = path.dirname(outputPath);
  const outputName = path.basename(outputPath, path.extname(outputPath));
  return path.join(outputDir, `${outputName}-${suffix}.png`);
}

async function step1ConvertToSquare(inputPath, debugOptions) {
  const metadata = await sharp(inputPath).metadata();
  const originalWidth = metadata.width;
  const originalHeight = metadata.height;
  if (!originalWidth || !originalHeight) {
    throw new Error("Could not determine input image dimensions.");
  }

  const squareSize = Math.max(originalWidth, originalHeight);
  const squareRaw = await sharp(inputPath)
    .removeAlpha()
    .resize(squareSize, squareSize, {
      fit: "contain",
      position: "center",
      background: { r: 0, g: 0, b: 0 },
    })
    .raw()
    .toBuffer();

  if (debugOptions.enabled) {
    const debugPath = getDebugPath(debugOptions.outputPath, "step1-square");
    await sharp(squareRaw, {
      raw: { width: squareSize, height: squareSize, channels: 3 },
    })
      .png()
      .toFile(debugPath);
    console.log(`Saved step 1 square image: ${debugPath}`);
  }

  return { originalWidth, originalHeight, squareSize, squareRaw };
}

async function step2CreateMaskFromSquare(
  squareRaw,
  squareSize,
  session,
  threshold,
  debugOptions,
) {
  const modelInputRaw = await sharp(squareRaw, {
    raw: { width: squareSize, height: squareSize, channels: 3 },
  })
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: "fill" })
    .raw()
    .toBuffer();

  const floatData = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  const stride = INPUT_SIZE * INPUT_SIZE;
  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i += 1) {
    floatData[i] = modelInputRaw[i * 3] / 255;
    floatData[stride + i] = modelInputRaw[i * 3 + 1] / 255;
    floatData[stride * 2 + i] = modelInputRaw[i * 3 + 2] / 255;
  }

  const inputName = session.inputNames[0];
  const outputs = await session.run({
    [inputName]: new ort.Tensor("float32", floatData, [1, 3, INPUT_SIZE, INPUT_SIZE]),
  });
  const outputTensor = outputs[session.outputNames[0]] || pickOutputTensor(outputs);
  const alpha320 = normalizeMask(outputTensor.data, INPUT_SIZE, INPUT_SIZE, threshold);

  const alphaRgba320 = Buffer.alloc(INPUT_SIZE * INPUT_SIZE * 4);
  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i += 1) {
    const a = alpha320[i];
    alphaRgba320[i * 4] = a;
    alphaRgba320[i * 4 + 1] = a;
    alphaRgba320[i * 4 + 2] = a;
    alphaRgba320[i * 4 + 3] = a;
  }

  const squareMask = await sharp(alphaRgba320, {
    raw: { width: INPUT_SIZE, height: INPUT_SIZE, channels: 4 },
  })
    .resize(squareSize, squareSize, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .extractChannel(3)
    .raw()
    .toBuffer();

  if (debugOptions.enabled) {
    const modelPath = getDebugPath(debugOptions.outputPath, "step2-model-input-320");
    const mask320Path = getDebugPath(debugOptions.outputPath, "step2-mask-320");
    const squareMaskPath = getDebugPath(debugOptions.outputPath, "step2-mask-square");

    await sharp(modelInputRaw, {
      raw: { width: INPUT_SIZE, height: INPUT_SIZE, channels: 3 },
    })
      .png()
      .toFile(modelPath);
    await sharp(Buffer.from(alpha320), {
      raw: { width: INPUT_SIZE, height: INPUT_SIZE, channels: 1 },
    })
      .png()
      .toFile(mask320Path);
    await sharp(squareMask, {
      raw: { width: squareSize, height: squareSize, channels: 1 },
    })
      .png()
      .toFile(squareMaskPath);

    console.log(`Saved step 2 model input: ${modelPath}`);
    console.log(`Saved step 2 mask 320: ${mask320Path}`);
    console.log(`Saved step 2 square mask: ${squareMaskPath}`);
  }

  return { squareMask };
}

async function step3ApplyMaskToSquare(squareRaw, squareMask, squareSize, debugOptions) {
  const squareRgba = Buffer.alloc(squareSize * squareSize * 4);
  for (let i = 0; i < squareSize * squareSize; i += 1) {
    squareRgba[i * 4] = squareRaw[i * 3];
    squareRgba[i * 4 + 1] = squareRaw[i * 3 + 1];
    squareRgba[i * 4 + 2] = squareRaw[i * 3 + 2];
    squareRgba[i * 4 + 3] = squareMask[i];
  }

  if (debugOptions.enabled) {
    const debugPath = getDebugPath(debugOptions.outputPath, "step3-square-masked");
    await sharp(squareRgba, {
      raw: { width: squareSize, height: squareSize, channels: 4 },
    })
      .png()
      .toFile(debugPath);
    console.log(`Saved step 3 masked square: ${debugPath}`);
  }

  return squareRgba;
}

async function step4ResizeToOriginalAspect(
  squareRgba,
  squareSize,
  originalWidth,
  originalHeight,
  outputPath,
) {
  const cropLeft = Math.floor((squareSize - originalWidth) / 2);
  const cropTop = Math.floor((squareSize - originalHeight) / 2);
  await sharp(squareRgba, {
    raw: { width: squareSize, height: squareSize, channels: 4 },
  })
    .extract({
      left: cropLeft,
      top: cropTop,
      width: originalWidth,
      height: originalHeight,
    })
    .png()
    .toFile(outputPath);
}

async function removeBackground({ inputPath, outputPath, modelPath, threshold = 0.5, debug = false }) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input image not found: ${inputPath}`);
  }
  if (!fs.existsSync(modelPath)) {
    throw new Error(`Model not found: ${modelPath}\nRun: npm run download-model`);
  }

  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ["cpu"],
    graphOptimizationLevel: "all",
  });

  const debugOptions = { enabled: Boolean(debug), outputPath };
  const step1 = await step1ConvertToSquare(inputPath, debugOptions);
  const step2 = await step2CreateMaskFromSquare(
    step1.squareRaw,
    step1.squareSize,
    session,
    threshold,
    debugOptions,
  );
  const squareRgba = await step3ApplyMaskToSquare(
    step1.squareRaw,
    step2.squareMask,
    step1.squareSize,
    debugOptions,
  );

  await step4ResizeToOriginalAspect(
    squareRgba,
    step1.squareSize,
    step1.originalWidth,
    step1.originalHeight,
    outputPath,
  );
  return outputPath;
}

export { removeBackground };


export default async function (file: { path: string }, ... args: any[] ): Promise<sharp.Sharp> {

    const size = {
        failOnError: false,
    } as any;

    try {

        const input = file.path;

        if (args.length === 0) {
            size.width = 0;
            size.height = 0;
        } else if (args.length === 1) {
            // tslint:disable-next-line: no-bitwise
            size.height = ~~args[0];
        } else {
            const [width, height, ... extra] = args;
            // tslint:disable-next-line: no-bitwise
            size.width = ~~width;
            // tslint:disable-next-line: no-bitwise
            size.height = ~~height;
            size.fit = "cover";
            for (let index = 0; index < extra.length / 2; index+=2) {
                const key = extra[index];
                const value = extra[index+1];
                if(key && value) {
                    size[key] = value;
                }
            }
        }

        if (size.height === 0 || size.width === 0) {
            return await (sharp(input, { animated: true, pages: -1}).rotate() as any);
        }
        return await (sharp(input, { animated: true, pages: -1}).rotate() as any)
        .resize(size);
    } catch (e) {
        console.log(e.stack ?? e);
        const err = `${JSON.stringify(size)}\n${e.stack ? e.stack : e}`;
        throw new Error(err);
    }
}