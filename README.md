# AWS-Serverless-Event-System

## Project Overview

This project is a fully serverless Event Announcement System built on AWS using AWS CDK with TypeScript. 
It enables users to submit new event announcements via an API and notifies subscribed users through Amazon SNS. 
All infrastructure is defined and deployed using AWS CDK, ensuring repeatable, scalable deployments.

Key Features:
- **Event Submission** API: Accepts new events via REST API and appends them to an events.json file stored in Amazon S3.
- **Email Notifications**: Each new event triggers a notification via Amazon SNS to all subscribed users.
- **Email Subscription API**: Allows users to subscribe to event notifications using their email addresses.
- **Serverless Architecture**: No server provisioning or management; fully built on Lambda, API Gateway, SNS, and S3.
- **Secure Access**: API endpoints are secured using API Keys.

## Infrastructure

The infrastructure is managed using AWS CDK (in TypeScript), located in the `infrastructure/` folder.

### Resources Created

- **S3 Bucket**: Stores the event file with all the events pushed.
- **Lambda Functions**: Used to subscribe user's email to SNS topic, and to add event to event file in S3 and send it to the SNS topic.
- **API Gateway**: Provides the endpoints to subscribe users and add events.
- **SNS Topic**: SNS Topic where user's email subscribe to and receive added events.
- **IAM Roles & Policies**: Provides necessary permissions for Lambda to access S3, SNS.

### Environment Management

The project uses the `cdk.json` file for environment configuration such as:

- AWS account and region settings.
- Lambda configuration parameters.
- S3 configuration parameters.
- API Gateway configuration parameters.
- SNS Topic configuration paremters.

You can customize these values before deploying the stack.

## Useful Commands

### CDK Commands (in `infrastructure/` folder)

- **Bootstrap AWS environment**  
  ```
  npm run cdk:bootstrap --profile <PROFILE_NAME>
  ```
- **Synth Infrastructure**
  ```
  npm run cdk:synth
  ```
- **Deploy Infrastructure**
  ```
  npm run cdk:deploy --profile <PROFILE_NAME>
  ```
- **Diff local changes against deployed stack**
  ```
  npm run cdk:diff --profile <PROFILE_NAME>
  ```

where ```<PROFILE_NAME>``` is an AWS account profile in your configuration file (AWS CLI).