from faststream.kafka.fastapi import KafkaRouter

from auth.core.settings import settings

kafka_router = KafkaRouter(settings.kafka_brokers)
