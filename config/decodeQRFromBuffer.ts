import { Jimp } from 'jimp'; 
import jsQR from 'jsqr';

export async function decodeQRFromBuffer(buffer: Buffer): Promise<string> {
    const image = await Jimp.read(buffer);
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const rgbaData = image.bitmap.data;

    const code = jsQR(new Uint8ClampedArray(rgbaData), width, height);
    
    if (!code) {
        throw new Error("QR kodni o'qib bo'lmadi yoki rasm sifati past");
    }
    
    return code.data;
}