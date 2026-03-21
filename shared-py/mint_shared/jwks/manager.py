import httpx
from joserfc import jwt
from joserfc.jwk import KeySet


class JWKSManager:
    _jwks_url: str
    _jwks: KeySet | None = None

    def __init__(self, jwks_url: str) -> None:
        self._jwks_url = jwks_url

    async def get_jwks(self) -> KeySet:
        _jwks = self._jwks
        if not _jwks:
            async with httpx.AsyncClient() as client:
                response = await client.get(self._jwks_url)
                _jwks = KeySet.import_key_set(response.json())
        return _jwks

    async def verify_token(self, token_str: str) -> dict | None:
        jwks = await self.get_jwks()
        try:
            token = jwt.decode(token_str, jwks)
            print(dir(token))
            return token.claims
        except Exception as e:
            print(e)
            return None
