import { JWTAuthGuard } from '@mint/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';

@ApiTags('social')
@ApiBearerAuth('access-token')
@Controller('api/v1/social/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'List contacts for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Contact list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Req() req: any) {
    return this.contactsService.listContacts(req.user.sub);
  }

  @Post()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Add a contact by user ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['contactId'],
      properties: { contactId: { type: 'string', example: 'clx1abc23def456' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Contact added' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async add(@Req() req: any, @Body() body: { contactId: string }) {
    return this.contactsService.addContact(req.user.sub, body.contactId);
  }

  @Delete(':contactId')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Remove a contact' })
  @ApiParam({ name: 'contactId', description: 'Contact user ID' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Req() req: any, @Param('contactId') contactId: string) {
    await this.contactsService.removeContact(req.user.sub, contactId);
    return { success: true };
  }
}
