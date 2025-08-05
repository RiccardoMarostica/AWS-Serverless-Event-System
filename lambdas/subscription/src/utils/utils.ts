import { SNSClient } from "@aws-sdk/client-sns";
import { Logger } from "pino";

let SNS_CLIENT: SNSClient;
let PINO_LOGGER: Logger;

export const getPinoLogger = (): Logger => {
  if (!PINO_LOGGER) {
    PINO_LOGGER = require('pino')({
      level: process.env.LOG_LEVEL || 'info'
    });
  }
  return PINO_LOGGER;
}

export const getSNSClient = (): SNSClient => {
  if (!SNS_CLIENT) {
    SNS_CLIENT = new SNSClient({
      region: process.env.AWS_REGION || 'eu-west-1', // Default to us-east-1 if not set
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