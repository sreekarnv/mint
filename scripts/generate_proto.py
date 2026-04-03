#!/usr/bin/env python3
"""
Generate Python gRPC code from wallet.proto

This script:
1. Checks if grpcio-tools is installed
2. Generates Python protobuf and gRPC code
3. Verifies the output
4. Provides helpful error messages

Usage:
    python scripts/generate_proto.py
"""

import subprocess
import sys
from pathlib import Path


def check_grpcio_tools():
    """Check if grpcio-tools is installed."""
    try:
        import grpc_tools
        return True
    except ImportError:
        return False


def install_grpcio_tools():
    """Install grpcio-tools using pip."""
    print("📦 grpcio-tools not found. Installing...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "grpcio-tools"
        ])
        print("✅ grpcio-tools installed successfully")
        return True
    except subprocess.CalledProcessError:
        return False


def generate_proto(repo_root: Path):
    """Generate protobuf code from wallet.proto."""
    
    # Define paths
    proto_dir = repo_root / "libs" / "proto"
    proto_file = proto_dir / "wallet.proto"
    output_dir = repo_root / "apps" / "wallet" / "src" / "wallet" / "proto" / "generated"
    
    # Verify proto file exists
    if not proto_file.exists():
        print(f"\n❌ Error: Proto file not found")
        print(f"   Expected: {proto_file}")
        print(f"   Current directory: {Path.cwd()}")
        print(f"\n💡 Make sure you're running this from the repository root:")
        print(f"   cd /path/to/mint-v2")
        print(f"   python scripts/generate_proto.py")
        return False
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create __init__.py files to make packages importable
    (repo_root / "apps" / "wallet" / "src" / "wallet" / "proto" / "__init__.py").touch(exist_ok=True)
    (output_dir / "__init__.py").touch(exist_ok=True)
    
    print("\n🔨 Generating Python protobuf stubs...")
    print(f"   Input:  {proto_file.relative_to(repo_root)}")
    print(f"   Output: {output_dir.relative_to(repo_root)}")
    
    # Build protoc command
    cmd = [
        sys.executable, "-m", "grpc_tools.protoc",
        f"-I{proto_dir}",
        f"--python_out={output_dir}",
        f"--grpc_python_out={output_dir}",
        str(proto_file)
    ]
    
    # Run protoc
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"\n❌ Error during code generation:")
        print(result.stderr)
        return False
    
    # Verify generated files
    pb2_file = output_dir / "wallet_pb2.py"
    grpc_file = output_dir / "wallet_pb2_grpc.py"
    
    if not pb2_file.exists() or not grpc_file.exists():
        print("\n❌ Error: Expected files were not generated")
        return False
    
    print("\n✅ Generation successful!")
    print(f"   ✓ {pb2_file.name} (message definitions)")
    print(f"   ✓ {grpc_file.name} (service definitions)")
    print(f"   ✓ __init__.py (package markers)")
    
    print("\n📦 Files location:")
    print(f"   {output_dir.relative_to(repo_root)}/")
    
    print("\n💡 Import in your code:")
    print("   from wallet.proto.generated import wallet_pb2, wallet_pb2_grpc")
    
    return True


def main():
    print("=" * 70)
    print("Wallet Service - Protobuf Code Generator")
    print("=" * 70)
    
    # Determine repository root
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    
    print(f"\n📍 Repository root: {repo_root}")
    
    # Check/install grpcio-tools
    if not check_grpcio_tools():
        print("\n⚠️  grpcio-tools is not installed")
        print("   This package is required to generate protobuf code")
        
        response = input("\n   Install it now? [Y/n]: ").strip().lower()
        if response in ('', 'y', 'yes'):
            if not install_grpcio_tools():
                print("\n❌ Failed to install grpcio-tools")
                print("   Please install manually:")
                print("   pip install grpcio-tools")
                sys.exit(1)
        else:
            print("\n❌ Cannot proceed without grpcio-tools")
            print("   Install it with: pip install grpcio-tools")
            sys.exit(1)
    else:
        print("\n✓ grpcio-tools is installed")
    
    # Generate protobuf code
    if generate_proto(repo_root):
        print("\n" + "=" * 70)
        print("✅ All done! Protobuf code generated successfully")
        print("=" * 70)
        print("\n🚀 Next steps:")
        print("1. Update your main.py to start the gRPC server")
        print("2. Test with: grpcurl -plaintext localhost:50051 list")
        sys.exit(0)
    else:
        print("\n" + "=" * 70)
        print("❌ Generation failed - see errors above")
        print("=" * 70)
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n Interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)