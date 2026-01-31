#!/usr/bin/env node
/**
 * Upload APK to Supabase Storage
 *
 * Usage:
 *   node scripts/upload-apk.js <path-to-apk> [version]
 *
 * Examples:
 *   node scripts/upload-apk.js app/FitStream-v1.1.4-user.apk 1.1.4
 *   node scripts/upload-apk.js app/FitStream-v1.1.4-user.apk
 *
 * Environment variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_KEY - Supabase service role key (required for uploads)
 */

import { createClient } from '@supabase/supabase-js';
import { readFile, stat } from 'fs/promises';
import { basename } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ouhvagzgwjlzygjcxdmb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'apk-releases';

async function uploadApk(apkPath, version) {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
    console.error('Get it from: https://supabase.com/dashboard/project/ouhvagzgwjlzygjcxdmb/settings/api');
    process.exit(1);
  }

  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  try {
    // Get file info
    const fileStats = await stat(apkPath);
    const fileSizeBytes = fileStats.size;
    const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(1);

    console.log(`\n📱 FitStream APK Uploader\n`);
    console.log(`File: ${apkPath}`);
    console.log(`Size: ${fileSizeMB} MB`);
    console.log(`Version: ${version}\n`);

    // Read APK file
    console.log('📦 Reading APK file...');
    const fileBuffer = await readFile(apkPath);

    // Upload versioned file
    const versionedPath = `FitStream-v${version}.apk`;
    console.log(`⬆️ Uploading ${versionedPath}...`);

    const { data: versionedData, error: versionedError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(versionedPath, fileBuffer, {
        contentType: 'application/vnd.android.package-archive',
        upsert: true
      });

    if (versionedError) {
      throw new Error(`Failed to upload versioned APK: ${versionedError.message}`);
    }

    // Upload as 'latest'
    const latestPath = 'FitStream-latest.apk';
    console.log(`⬆️ Uploading ${latestPath}...`);

    const { data: latestData, error: latestError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(latestPath, fileBuffer, {
        contentType: 'application/vnd.android.package-archive',
        upsert: true
      });

    if (latestError) {
      throw new Error(`Failed to upload latest APK: ${latestError.message}`);
    }

    // Parse version code from version string (e.g., "1.1.4" -> 114)
    const versionParts = version.split('.');
    const versionCode = parseInt(versionParts[0]) * 100 +
                        parseInt(versionParts[1] || 0) * 10 +
                        parseInt(versionParts[2] || 0);

    // Insert release record
    console.log('📝 Recording release...');
    const { error: releaseError } = await supabase
      .from('app_releases')
      .insert({
        version: version,
        version_code: versionCode,
        file_path: versionedPath,
        file_size: fileSizeBytes,
        changelog: `Release v${version}`,
        min_android_sdk: 26, // Android 8.0
      });

    if (releaseError && !releaseError.message.includes('duplicate')) {
      console.warn(`Warning: Could not record release: ${releaseError.message}`);
    }

    // Get public URLs
    const { data: publicUrl } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(latestPath);

    console.log('\n✅ Upload complete!\n');
    console.log('Public URLs:');
    console.log(`  Latest:    ${publicUrl.publicUrl}`);
    console.log(`  Versioned: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${versionedPath}`);
    console.log('\n🎉 APK is now available for download!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/upload-apk.js <path-to-apk> [version]');
  console.error('Example: node scripts/upload-apk.js app/FitStream-v1.1.4-user.apk 1.1.4');
  process.exit(1);
}

const apkPath = args[0];

// Extract version from filename if not provided
let version = args[1];
if (!version) {
  const match = basename(apkPath).match(/v?(\d+\.\d+\.\d+)/);
  if (match) {
    version = match[1];
  } else {
    console.error('Error: Could not extract version from filename. Please provide version as second argument.');
    process.exit(1);
  }
}

uploadApk(apkPath, version);
