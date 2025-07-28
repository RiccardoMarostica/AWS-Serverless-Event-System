import * as cdk from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { getDurationInSeconds, getLambdaArchitecture } from '../utils/utils';
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Cors, EndpointType, LambdaIntegration, Period, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Tags } from 'aws-cdk-lib';

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

    
    // API Gateway - Event registration and subscription API
    const apiGatewayConfig = envsConfig[env].apiGateway;
    const api = new RestApi(this, 'EventSystemApi', {
      restApiName: `${projectName}-api-${env}`,
      description: 'API for event registration and subscription',
      endpointTypes: apiGatewayConfig.endpointTypes || [EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apiGatewayConfig.allowOrigins || Cors.ALL_ORIGINS,
        allowMethods: apiGatewayConfig.allowMethods || Cors.ALL_METHODS,
        allowHeaders: apiGatewayConfig.allowHeaders || Cors.DEFAULT_HEADERS
      },
      deploy: true,
      deployOptions: {
        stageName: env,
        description: `Deployment stage for ${projectName} in ${env}`
      }
    });

    // Create the API Key for usage plans
    const apiKey = api.addApiKey('EventSystemApiKey', {
      apiKeyName: `${projectName}-api-key-${env}`,
      description: 'API Key for Event System API'
    });

    // Create a usage plan for the API
    const usagePlan = api.addUsagePlan('EventSystemUsagePlan', {
      name: `${projectName}-usage-plan-${env}`,
      description: 'Usage plan for Event System API',
      apiStages: [{
        api: api,
        stage: api.deploymentStage
      }],
      throttle: {
        burstLimit: apiGatewayConfig.burstLimit || 100,
        rateLimit: apiGatewayConfig.rateLimit || 50
      },
      quota: {
        limit: apiGatewayConfig.quota.limit || 1000,
        period: apiGatewayConfig.quota.period || Period.MONTH
      }
    });
    // Associate the API Key with the usage plan
    usagePlan.addApiKey(apiKey);

    // Create the /subscribe resource and link it to the subscription Lambda function
    const subscribeResource = api.root.addResource('subscribe');
    subscribeResource.addMethod('POST', new LambdaIntegration(subscriptionLambda), {
      apiKeyRequired: true
    });

    // Create the /event resource and link it to the event registration Lambda function
    const eventResource = api.root.addResource('event');
    eventResource.addMethod('POST', new LambdaIntegration(eventRegistrationLambda), {
      apiKeyRequired: true
    });


    // SNS Topic - Event notifications
    const eventNotificationTopicConfig = envsConfig[env].eventNotificationTopic;
    const eventNotificationTopic = new Topic(this, 'EventNotificationTopic', {
      topicName: `${projectName}-event-notification-topic-${env}`,
      displayName: 'Event Notification Topic',
      fifo: eventNotificationTopicConfig.fifo || false,
      contentBasedDeduplication: eventNotificationTopicConfig.fifo ? (eventNotificationTopicConfig.contentBasedDeduplication || false) : undefined,
      enforceSSL: eventNotificationTopicConfig?.enforceSSL || false,
    });
    eventNotificationTopic.grantSubscribe(subscriptionLambda);
    eventNotificationTopic.grantPublish(eventRegistrationLambda);

    
    // Lastly, add tags to resources
    Tags.of(this).add('project', projectName);
    Tags.of(this).add('env', env);
  }
}
