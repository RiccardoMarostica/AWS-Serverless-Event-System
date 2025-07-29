import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { getPinoLogger, getResponse, getSNSClient } from './utils/utils';
import { SubscribeCommand } from '@aws-sdk/client-sns';

const sns = getSNSClient();
const logger = getPinoLogger();

// Environment variables
const TOPIC_ARN = process.env.TOPIC_ARN!;

export const handler = async (event: APIGatewayEvent) => {
  try {

    logger.info('Received event:', { event });

    // Retrieve the email address from the request body
    const body = JSON.parse(event.body || '{}');
    const email = body['email'];

    if (!email) {
      // If email is not provided, return a 400 Bad Request response
      return getResponse(400, { error: 'Missing email address.' });
    }

    // Subscribe the email to the SNS topic
    const response = await sns.send(new SubscribeCommand({
      TopicArn: TOPIC_ARN,
      Protocol: 'email',
      Endpoint: email,
      ReturnSubscriptionArn: true
    }));

    logger.info('Subscription response:', { response });

    // Return a 200 OK response with a message
    return getResponse(200, { message: 'Subscription requested. Please check your email to confirm.' });

  } catch (error) {
    // Return a 500 Internal Server Error response if an error occurs
    return getResponse(500, { error: 'Internal server error.' });
  }
};
