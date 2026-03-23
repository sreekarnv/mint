from pydantic import BaseModel


class KafkaEnvelope(BaseModel):
    topic: str
    eventId: str
    version: str
    actorId: str
    payload: dict