import { CommonModule } from '@mint/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuditEventsConsumer } from './audit-events.consumer';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [
    CommonModule,
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'audit-service',
            brokers: [process.env.KAFKA_BROKERS!],
          },
          consumer: {
            groupId: 'audit-service',
          },
        },
      },
    ]),
  ],
  controllers: [AuditController, AuditEventsConsumer],
  providers: [AuditService],
})
export class AuditModule {}
