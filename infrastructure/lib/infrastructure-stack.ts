import * as cdk from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { getDurationInSeconds, getLambdaArchitecture } from '../utils/utils';
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { Cors, EndpointType, LambdaIntegration, Period, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Tags } from 'aws-cdk-lib';
import { 
  Distribution, 
  OriginAccessIdentity, 
  ViewerProtocolPolicy, 
  AllowedMethods,
  CachePolicy,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  HeadersFrameOption,
  HeadersReferrerPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

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
      resources: [
        eventStorageBucket.bucketArn,
        `${eventStorageBucket.bucketArn}/*`
      ],
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

    // Add environment variables to Lambda functions for the SNS topic ARN
    subscriptionLambda.addEnvironment('EVENT_NOTIFICATION_TOPIC_ARN', eventNotificationTopic.topicArn);
    eventRegistrationLambda.addEnvironment('EVENT_NOTIFICATION_TOPIC_ARN', eventNotificationTopic.topicArn);
    eventRegistrationLambda.addEnvironment('BUCKET_NAME', eventStorageBucket.bucketName);


    // Frontend Infrastructure - S3 Bucket for static website hosting
    const frontendBucketConfig = envsConfig[env].frontendBucket || {};
    const frontendBucket = new Bucket(this, 'FrontendBucket', {
      bucketName: `${projectName}-frontend-${env}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      enforceSSL: frontendBucketConfig?.enforceSSL || true,
      versioned: frontendBucketConfig?.versioned || false
    });

    // Origin Access Identity for CloudFront
    const originAccessIdentity = new OriginAccessIdentity(this, 'FrontendOAI', {
      comment: `OAI for ${projectName} frontend in ${env}`
    });

    // Grant CloudFront access to the S3 bucket
    frontendBucket.grantRead(originAccessIdentity);

    // Response Headers Policy for security headers
    const responseHeadersPolicy = new ResponseHeadersPolicy(this, 'FrontendSecurityHeaders', {
      responseHeadersPolicyName: `${projectName}-security-headers-${env}`,
      comment: 'Security headers for frontend application',
      securityHeadersBehavior: {
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, override: true },
        strictTransportSecurity: { 
          accessControlMaxAge: cdk.Duration.seconds(31536000),
          includeSubdomains: true,
          preload: true,
          override: true
        },
        contentSecurityPolicy: {
          contentSecurityPolicy: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            `connect-src 'self' ${api.url}`,
            "img-src 'self' data: https:",
            "font-src 'self'"
          ].join('; '),
          override: true
        }
      },
      customHeadersBehavior: {
        customHeaders: [
          {
            header: 'X-Content-Type-Options',
            value: 'nosniff',
            override: true
          },
          {
            header: 'X-Frame-Options',
            value: 'DENY',
            override: true
          }
        ]
      }
    });

    // CloudFront Distribution for frontend
    const frontendDistributionConfig = envsConfig[env].frontendDistribution || {};
    const frontendDistribution = new Distribution(this, 'FrontendDistribution', {
      comment: `${projectName} frontend distribution for ${env}`,
      defaultBehavior: {
        origin: new S3Origin(frontendBucket, {
          originAccessIdentity: originAccessIdentity
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy: responseHeadersPolicy,
        compress: true
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5)
        },
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5)
        },
        {
          httpStatus: 500,
          responseHttpStatus: 500,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(1)
        },
        {
          httpStatus: 502,
          responseHttpStatus: 500,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(1)
        },
        {
          httpStatus: 503,
          responseHttpStatus: 500,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(1)
        },
        {
          httpStatus: 504,
          responseHttpStatus: 500,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(1)
        }
      ],
      priceClass: frontendDistributionConfig.priceClass || undefined,
      enabled: true
    });

    // Update API Gateway CORS to include the CloudFront domain
    // Note: The actual domain will be available after deployment
    // For now, we'll output the domain and update CORS manually or in a subsequent deployment

    // Outputs for easy access to important values
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'Name of the S3 bucket hosting the frontend'
    });

    new cdk.CfnOutput(this, 'FrontendDistributionId', {
      value: frontendDistribution.distributionId,
      description: 'CloudFront distribution ID for the frontend'
    });

    new cdk.CfnOutput(this, 'FrontendDistributionDomain', {
      value: frontendDistribution.distributionDomainName,
      description: 'CloudFront distribution domain name for the frontend'
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${frontendDistribution.distributionDomainName}`,
      description: 'Frontend application URL'
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL for backend services'
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for accessing the backend API'
    });

    // Lastly, add tags to resources
    Tags.of(this).add('project', projectName);
    Tags.of(this).add('env', env);
  }
}
