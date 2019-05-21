## Overview
These are the steps and (work in progress) CloudFormation required to set up a [visitor prioritization](https://aws.amazon.com/blogs/networking-and-content-delivery/visitor-prioritization-on-e-commerce-websites-with-cloudfront-and-lambdaedge/) solution using AWS services.

## Create website
1. Create S3 bucket
  ```
  aws cloudformation create-stack \
    --stack-name visitor-prioritization-website \
    --template-body file://cloudformation/s3.yml \
    --parameters file://cloudformation/s3-parameters.json \
    --region us-east-1
  ```
2. Upload files to S3 bucket
```
aws s3 cp website/index.html s3://mcwhirter-prioritization/shop/index.html
aws s3 cp website/please-try-again.html s3://mcwhirter-prioritization/waitingroom/please-try-again.html
```

## Create CloudFront distribution
1. Create

## Create prioritization function
1. Zip Lambda code and upload to S3
```
cd lambda && zip lambda.zip prioritize.js setup.cfg && mv -f lambda.zip ../ && cd ../
aws s3 cp lambda.zip s3://mcwhirter-prioritization/lambda.zip
```
2. Create IAM role and Lambda function
  ```
  aws cloudformation create-stack \
    --stack-name visitor-prioritization-function \
    --template-body file://cloudformation/lambda.yml \
    --parameters file://cloudformation/lambda-parameters.json \
    --region us-east-1
  ```

## Test
