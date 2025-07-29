import { SNSClient } from "@aws-sdk/client-sns";
import { S3Client } from "@aws-sdk/client-s3";
import { Logger } from "pino";

let SNS_CLIENT: SNSClient;
let S3_CLIENT: S3Client;
let PINO_LOGGER: Logger;

export const getPinoLogger = (): Logger => {
  if (!PINO_LOGGER) {
    PINO_LOGGER = require('pino')({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard'
        }
      }
    });
  }
  return PINO_LOGGER;
}

export const getS3Client = (): S3Client => {
  if (!S3_CLIENT) {
    S3_CLIENT = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-1', // Default to eu-west-1 if not set
    });
  }
  return S3_CLIENT;
}

export const getSNSClient = (): SNSClient => {
  if (!SNS_CLIENT) {
    SNS_CLIENT = new SNSClient({
      region: process.env.AWS_REGION || 'eu-west-1', // Default to eu-west-1 if not set
    });
  }
  return SNS_CLIENT;
}

export const getResponse = (statusCode: number, body: any) => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust as necessary for CORS
      'Content-Type': 'application/json'
    },
  };
}