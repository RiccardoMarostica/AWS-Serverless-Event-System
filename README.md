# AWS-Serverless-Event-System

## Project Overview


## Infrastructure


### Resources Created


### Environment Management

The project uses the `cdk.json` file for environment configuration such as:

<TODO> Aggiungere configurazioni

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
  npm run cdk:deploy --profile <PROFILE_NAME>
  ```

where ```<PROFILE_NAME>``` is an AWS account profile in your configuration file (AWS CLI).