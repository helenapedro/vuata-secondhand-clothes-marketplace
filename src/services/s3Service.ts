import s3 from '../helpers/awsConfig';
import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../helpers/logger';

const BUCKET_NAME = "vuata-mediafiles";
const CLOUDFRONT_URL = "https://d1ldjxzzmwekb0.cloudfront.net";

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
  const day = date.getDate().toString().padStart(2, '0'); 
  return `${year}-${month}-${day}`;
};

const uploadToS3 = async (file: Express.Multer.File) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only images and videos are allowed.');
  }

  const ext = path.extname(file.originalname);
  const formattedDate = formatDate(new Date());
  const uniqueId = uuidv4();

  const fileName = `media/vuata_${formattedDate}_${uniqueId}${ext}`; 
  
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const retryLimit = 3;

  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    try {
      const upload = new Upload({
        client: s3,
        params: uploadParams,
      });

      const result = await upload.done();

      return `${CLOUDFRONT_URL}/${result.Key}`;

    } catch (error) {
      logger.error(`Error uploading file to S3, attempt ${attempt}:`, error);
      if (attempt === retryLimit) {
        throw new Error('Upload to S3 failed after multiple attempts');
      }
    }
  }
};

const deleteFromS3 = async (url: string): Promise<void> => {
  const key = url.replace(`${CLOUDFRONT_URL}/`, '');

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    logger.info(`File deleted successfully from S3: ${key}`);
  } catch (error) {
    logger.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export { upload, uploadToS3, deleteFromS3 };
