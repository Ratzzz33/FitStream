#!/bin/bash

# FitStream Android Release Setup Script
# This script helps you create a signing keystore for Google Play

echo "==================================="
echo "FitStream Android Release Setup"
echo "==================================="
echo ""

KEYSTORE_FILE="android/fitstream-release.keystore"
PROPERTIES_FILE="android/keystore.properties"

# Check if keystore already exists
if [ -f "$KEYSTORE_FILE" ]; then
    echo "Keystore already exists at $KEYSTORE_FILE"
    echo "Delete it first if you want to create a new one."
    exit 1
fi

# Generate keystore
echo "Creating signing keystore..."
echo "You will be prompted for:"
echo "  - Keystore password (remember this!)"
echo "  - Key password (can be same as keystore password)"
echo "  - Your name and organization details"
echo ""

keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias fitstream \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

if [ $? -ne 0 ]; then
    echo "Failed to create keystore"
    exit 1
fi

echo ""
echo "Keystore created successfully!"
echo ""

# Create properties file
echo "Creating keystore.properties..."
read -sp "Enter keystore password: " STORE_PASS
echo ""
read -sp "Enter key password: " KEY_PASS
echo ""

cat > "$PROPERTIES_FILE" << EOF
storePassword=$STORE_PASS
keyPassword=$KEY_PASS
keyAlias=fitstream
storeFile=fitstream-release.keystore
EOF

echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "IMPORTANT: Backup these files securely!"
echo "  - $KEYSTORE_FILE"
echo "  - $PROPERTIES_FILE"
echo ""
echo "If you lose the keystore, you cannot update your app on Google Play!"
echo ""
echo "Next steps:"
echo "  1. npm run build"
echo "  2. npx cap sync android"
echo "  3. Open Android Studio: npx cap open android"
echo "  4. Build > Generate Signed Bundle/APK"
echo ""
