from wallet.routes.kafka import kafka_router
from wallet.kafka.consumers.schema import KafkaEnvelope


@kafka_router.subscriber("transactions.events", group_id="wallet-service")
async def handle_txn_events(envelop: KafkaEnvelope):
    print("GOT MESSAGE HERE TXN", envelop)
