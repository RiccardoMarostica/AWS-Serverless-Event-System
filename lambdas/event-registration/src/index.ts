import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getPinoLogger, getResponse, getS3Client, getSNSClient } from './utils/utils';
import { PublishCommand } from '@aws-sdk/client-sns';

const sns = getSNSClient();
const s3 = getS3Client();
const logger = getPinoLogger();

// Environment variables
const BUCKET_NAME = process.env.BUCKET_NAME!;
const OBJECT_KEY = process.env.OBJECT_KEY || 'events.json';
const TOPIC_ARN = process.env.EVENT_NOTIFICATION_TOPIC_ARN!;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {

    logger.info({ msg: 'Received event', event });

    // Retrieve the email address from the request body
    const newEvent = JSON.parse(event.body || '{}');

    // Retrieve the S3 object
    const s3Object = await s3.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: OBJECT_KEY
    }));
    
    if (!s3Object.Body) {
      throw new Error('No data found in S3 object');
    }

    // Parse the existing events from the S3 object
    let currentEvents: any[] = JSON.parse(await s3Object.Body!.transformToString('utf-8'));
    logger.info({ msg: 'Current events retrieved from S3', currentEvents });

    currentEvents.push(newEvent);
    logger.info({ msg: 'New event added', newEvent });

    // Store the updated events back to S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: OBJECT_KEY,
      Body: JSON.stringify(currentEvents),
      ContentType: 'application/json'
    }));

    // Publish the new event to the SNS topic
    await sns.send(new PublishCommand({
      TopicArn: TOPIC_ARN,
      Message: JSON.stringify(newEvent),
      Subject: 'New Event Registration'
    }));

    // Return a 200 OK response with a message
    return getResponse(200, { message: 'Event registered successfully.' });

  } catch (error) {

    logger.error({ msg: 'Error processing subscription', error });
    
    // Return a 500 Internal Server Error response if an error occurs
    return getResponse(500, { error: 'Internal server error.' });
  }
};
