import { Controller, Get, Inject, Query } from '@nestjs/common';
import * as Minio from 'minio';

@Controller('minio')
export class MinioController {
  @Inject('MINIO_CLIENT')
  private minioClient: Minio.Client;

  @Get('presignedUrl')
  async presignedPutObject(@Query('name') name: string) {
    //预签名
    return await this.minioClient.presignedPutObject('chat-room', name, 3600);
  }
}
