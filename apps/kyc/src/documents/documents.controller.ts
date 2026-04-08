import { JWTAuthGuard } from '@mint/common';
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
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DocType } from '../generated/prisma/enums';
import { DocumentsService } from './documents.service';

@ApiTags('kyc')
@ApiBearerAuth('access-token')
@Controller('api/v1/kyc/documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Post()
  @UseGuards(JWTAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a KYC identity document (multipart/form-data)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'type',
    description: 'Document type',
    enum: ['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID', 'UTILITY_BILL'],
  })
  @ApiQuery({
    name: 'docName',
    required: false,
    description: 'Optional document label',
  })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  @ApiResponse({ status: 400, description: 'No file or invalid type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
