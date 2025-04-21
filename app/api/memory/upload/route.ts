import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateUUID } from '@/lib/utils';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(req: NextRequest) {
  // Verify user is authenticated
  const session = await getServerSession(auth);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const blockType = formData.get('blockType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!['image', 'audio'].includes(blockType)) {
      return NextResponse.json(
        { error: 'Invalid block type' },
        { status: 400 },
      );
    }

    // Check file type
    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    const isAudio = fileType.startsWith('audio/');

    if (
      (blockType === 'image' && !isImage) ||
      (blockType === 'audio' && !isAudio)
    ) {
      return NextResponse.json(
        { error: 'File type does not match block type' },
        { status: 400 },
      );
    }

    // Get file buffer
    const fileBuffer = await file.arrayBuffer();

    // Generate file key
    const fileExtension = file.name.split('.').pop();
    const userId = session.user.id;
    const fileName = `${userId}/${blockType}/${generateUUID()}.${fileExtension}`;

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET || 'ai-chronicle',
      Key: fileName,
      Body: Buffer.from(fileBuffer),
      ContentType: fileType,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate pre-signed URL for client-side access
    const command = new PutObjectCommand(uploadParams);
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    // Construct the public URL
    const bucketUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const publicUrl = `${bucketUrl}/${fileName}`;

    return NextResponse.json({
      url: publicUrl,
      signedUrl,
      success: true,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    );
  }
}
