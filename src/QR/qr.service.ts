import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {

  async generateBase64(data: string): Promise<string> {
    const qr = await QRCode.toDataURL(data); 
    return qr;
  }

}
