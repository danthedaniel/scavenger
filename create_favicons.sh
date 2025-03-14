#!/bin/bash

SOURCE_SVG="/Users/daniel/git/scavenger/public/images/logo.svg"
DEST_DIR="/Users/daniel/git/scavenger/public/favicon"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first."
    echo "You can install it with: brew install imagemagick"
    exit 1
fi

echo "Creating favicon files from $SOURCE_SVG..."

# Create directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Create favicon-16x16.png
echo "Creating favicon-16x16.png..."
convert -background none -resize 16x16 "$SOURCE_SVG" "$DEST_DIR/favicon-16x16.png"

# Create favicon-32x32.png
echo "Creating favicon-32x32.png..."
convert -background none -resize 32x32 "$SOURCE_SVG" "$DEST_DIR/favicon-32x32.png"

# Create apple-touch-icon.png (180x180)
echo "Creating apple-touch-icon.png..."
convert -background none -resize 180x180 "$SOURCE_SVG" "$DEST_DIR/apple-touch-icon.png"

# Create android-chrome-192x192.png
echo "Creating android-chrome-192x192.png..."
convert -background none -resize 192x192 "$SOURCE_SVG" "$DEST_DIR/android-chrome-192x192.png"

# Create android-chrome-512x512.png
echo "Creating android-chrome-512x512.png..."
convert -background none -resize 512x512 "$SOURCE_SVG" "$DEST_DIR/android-chrome-512x512.png"

# Create favicon.ico (multiple sizes: 16x16, 32x32, 48x48)
echo "Creating favicon.ico..."
convert -background none -resize 16x16 "$SOURCE_SVG" -resize 32x32 "$SOURCE_SVG" -resize 48x48 "$SOURCE_SVG" "$DEST_DIR/favicon.ico"

echo "All favicon files have been created successfully!"
echo "Files created in $DEST_DIR:"
ls -la "$DEST_DIR"
