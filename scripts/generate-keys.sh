#!/bin/sh
set -e
mkdir -p keys
openssl genrsa -out keys/private_key.pem 2048
openssl rsa -in keys/private_key.pem -pubout -out keys/public_key.pem
chmod 600 keys/private_key.pem
echo "RSA key pair generated in ./keys/"
echo "Add keys/ to .gitignore if not already present"
