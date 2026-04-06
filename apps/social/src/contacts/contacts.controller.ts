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
import { ContactsService } from './contacts.service';

@Controller('api/v1/social/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  async list(@Req() req: any) {
    return this.contactsService.listContacts(req.user.sub);
  }

  @Post()
  @UseGuards(JWTAuthGuard)
  async add(@Req() req: any, @Body() body: { contactId: string }) {
    return this.contactsService.addContact(req.user.sub, body.contactId);
  }

  @Delete(':contactId')
  @UseGuards(JWTAuthGuard)
  async remove(@Req() req: any, @Param('contactId') contactId: string) {
    await this.contactsService.removeContact(req.user.sub, contactId);
    return { success: true };
  }
}
