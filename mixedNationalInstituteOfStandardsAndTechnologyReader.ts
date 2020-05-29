interface Image {
  label: number
  bitmap: number[][]
}

interface ReadOptions {
  encoding?: string
}

async function readFileStr(filename: string, opts: ReadOptions = {}): Promise<string> {
  const decoder = new TextDecoder(opts.encoding)
  return decoder.decode(await Deno.readFile(filename))
}
export const readDatabase = async () => {
  const imagesStream = await readFileStr('./train-images-idx3-ubyte')
  const labels = await readFileStr('./train-labels-idx1-ubyte')
  if (
    imagesStream.charCodeAt(2) !== 8 ||
    imagesStream.charCodeAt(3) !== 3 ||
    labels.charCodeAt(2) !== 8 ||
    labels.charCodeAt(3) !== 1
  ) {
    return
  }
  const imagesMetadata = Int32Array.from(imagesStream, c => c.codePointAt(0) || 0)
  const imagesByteArray = Uint8Array.from(imagesStream, c => c.codePointAt(0) || 0)
  const labelsByteArray = Uint8Array.from(labels, c => c.codePointAt(0) || 0)
  const height = imagesMetadata[11]
  const width = imagesMetadata[15]
  const imagesCount = (imagesByteArray.length - 16) / (width * height)

  const images: Image[] = Array(Math.floor(imagesCount)).fill(0)

  for (let i = 0; i < imagesCount; i++) {
    images[i] = {
      label: labelsByteArray[i + 8],
      bitmap: Array(height).fill(Array(width).fill(0))
    }
    for (let j = 0; j < width; j++) {
      for (let k = 0; k < height; k++) {
        images[i].bitmap[j][k] = imagesByteArray[i * width * height + j * height + k + 16]
      }
    }
  }
  return images
}
