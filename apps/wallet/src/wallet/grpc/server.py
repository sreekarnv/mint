from concurrent import futures
import grpc

from wallet.proto.generated.wallet_pb2_grpc import add_WalletServiceServicer_to_server
from wallet.grpc.servicer import WalletServicer


async def start_grpc_server(get_db, port=50051):
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    
    servicer = WalletServicer(get_db)
    add_WalletServiceServicer_to_server(servicer, server)
    
    server.add_insecure_port(f"[::]:{port}")
    await server.start()
    
    print(f"wallet gRPC server listening on port {port}")
    
    return server