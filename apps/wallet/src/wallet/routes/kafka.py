from faststream.kafka.fastapi import KafkaRouter

from wallet.core.settings import settings

kafka_router = KafkaRouter(settings.kafka_brokers)
