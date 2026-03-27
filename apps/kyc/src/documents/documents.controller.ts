import {
  BadRequestException,
  Controller,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JWTAuthGuard } from '@mint/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocType } from '../generated/prisma/enums';

@Controller('api/v1/kyc/documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Post()
  @UseGuards(JWTAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: string,
    @Query('docName') docName?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No File Provided');
    }

    const docType = type?.toUpperCase() as DocType;

    if (!Object.values(DocType).includes(docType)) {
      throw new BadRequestException(
        `Invalid type. Must be ${Object.values(DocType)}`,
      );
    }

    return this.docs.uploadDocument(
      (req as any).user.sub,
      file,
      docType,
      docName,
    );
  }
}
