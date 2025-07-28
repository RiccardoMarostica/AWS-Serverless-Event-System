import * as cdk from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { getDurationInSeconds, getLambdaArchitecture } from '../utils/utils';
import { Role, ServicePrincipal, ManagedPolicy, Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Retrieve enviroment to work with
    const env = this.node.tryGetContext('env') || 'dev';

    // Retrieve configuration for the current environment.
    // This is used to retrieve configurations for the stack
    const envsConfig = this.node.tryGetContext(`envs`);

    // Retrieve project name (used as prefix for all resources)
    const projectName = envsConfig[env].projectName;


    // S3 Bucket - Event registration storage
    const eventStorageBucketConfig = envsConfig[env].eventStorageBucket;
    const eventStorageBucket = new Bucket(this, 'EventStorageBucket', {
      bucketName: `${projectName}-event-storage-bucket-${env}`,
      versioned: eventStorageBucketConfig?.versioned || true,
      blockPublicAccess: eventStorageBucketConfig?.blockPublicAccess || BlockPublicAccess.BLOCK_ALL,
      enforceSSL: eventStorageBucketConfig?.enforceSSL || true
    });

    // Create a policy statement to allow Lambda functions to access the S3 bucket
    let lambdaStorageBucketPolicy = new PolicyStatement({
       actions: [
        's3:GetObject',
        's3:PutObject'
      ],
      resources: [eventStorageBucket.bucketArn],
      effect: Effect.ALLOW
    });


    // IAM Role - Lambda execution role
    const subscriptionLambdaRole = new Role(this, 'SubscriptionLambdaRole', {
      roleName: `${projectName}-subscription-lambda-role-${env}`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: "IAM Role used by Subscription Lambda function",
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ]
    });
    subscriptionLambdaRole.addToPolicy(lambdaStorageBucketPolicy);

    // Lambda function - Subscription to SNS topic
    const subscriptionLambdaConfig = envsConfig[env].subscriptionLambda;
    const subscriptionLambda = new Function(this, 'SubscriptionLambda', {
      functionName: `${projectName}-add-subscription-${env}`,
      description: 'Lambda function to handle event subscriptions for an SNS topic',
      code: Code.fromAsset(__dirname + '../../../lambdas/subscription/dist'),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_22_X,
      architecture: getLambdaArchitecture(subscriptionLambdaConfig.architecture),
      environment: subscriptionLambdaConfig.environment || null,
      memorySize: subscriptionLambdaConfig.memorySize || 128,
      timeout: getDurationInSeconds(subscriptionLambdaConfig.timeout),
      role: subscriptionLambdaRole
    });


    // IAM Role - Lambda execution role
    const eventRegistrationRole = new Role(this, 'EventRegistrationRole', {
      roleName: `${projectName}-event-registration-lambda-role-${env}`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: "IAM Role used by Event Registration Lambda function",
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ]
    });
    eventRegistrationRole.addToPolicy(lambdaStorageBucketPolicy);

    // Lambda function - Event registration
    const eventRegistrationLambdaConfig = envsConfig[env].eventRegistrationLambda;
    const eventRegistrationLambda = new Function(this, 'EventRegistrationLambda', {
      functionName: `${projectName}-event-registration-${env}`,
      description: 'Lambda function to handle event registrations',
      code: Code.fromAsset(__dirname + '../../../lambdas/event-registration/dist'),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_22_X,
      architecture: getLambdaArchitecture(eventRegistrationLambdaConfig.architecture),
      environment: eventRegistrationLambdaConfig.environment || null,
      memorySize: eventRegistrationLambdaConfig.memorySize || 128,
      timeout: getDurationInSeconds(eventRegistrationLambdaConfig.timeout),
      role: eventRegistrationRole
    });


    // SNS Topic - Event notifications


    // API Gateway - Event registration and subscription API

  }
}
