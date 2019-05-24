## Overview
These are the steps and CloudFormation required to set up a [visitor prioritization](https://aws.amazon.com/blogs/networking-and-content-delivery/visitor-prioritization-on-e-commerce-websites-with-cloudfront-and-lambdaedge/) solution using AWS services.

todo:
* [x] Refine and test Lambda+IAM
* [x] Refine and test S3+CloudFront
* [x] Refine and test complete solution

## Steps
1. Create S3 bucket and CloudFront distribution
  ```
  aws cloudformation create-stack \
    --stack-name visitor-prioritization-website \
    --template-body file://cloudformation/website.yml \
    --parameters file://cloudformation/website-parameters.json \
    --region us-east-1
  ```
2. Upload files to S3 bucket
```
aws s3 cp website/index.html s3://mcwhirter-prioritization/shop/index.html
aws s3 cp website/please-try-again.html s3://mcwhirter-prioritization/waitingroom/please-try-again.html
```
3. Modify lambda/prioritize.js to match your desired functionality. Be sure to review:
  * originAcceptingTraffic
  * originHitRate
  * waitingRoomS3
4. Zip Lambda code and upload to S3
```
cd lambda && zip lambda.zip prioritize.js setup.cfg && mv -f lambda.zip ../ && cd ../
aws s3 cp lambda.zip s3://mcwhirter-prioritization/lambda.zip
```
5. Create IAM role and Lambda function
  ```
  aws cloudformation create-stack \
    --stack-name visitor-prioritization-function \
    --template-body file://cloudformation/lambda.yml \
    --parameters file://cloudformation/lambda-parameters.json \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1
  ```
6. Publish the Lambda function to the edge using Console
  1. Add CloudFront trigger
  2. Deploy to Lambda@Edge
  3. Pick the distribution
  4. Pick '/shop/*' as the cache behavior
  5. Agree and deploy

## Test
1. Test an allowed interaction using a valid cookie
  * Given originAcceptingTraffic=true, originHitRate=0
  * Expect 'This is my shop'
  ```
  curl -X GET \
    http://<your_cloudfront_domain>/shop/index.html \
    -H 'Accept: */*' \
    -H 'Cache-Control: no-cache' \
    -H 'Connection: keep-alive' \
    -H 'Host: <your_cloudfront_domain>' \
    -H 'Postman-Token: d4b54b4e-61b4-4ec6-8f28-894879e5de81,9a8646df-fcab-4d17-8aaf-af2519e049af' \
    -H 'User-Agent: PostmanRuntime/7.11.0' \
    -H 'accept-encoding: gzip, deflate' \
    -H 'cache-control: no-cache' \
    -H 'cookie: premium-user-cookie=some-secret-cookie-value' \
    -b premium-user-cookie=some-secret-cookie-value
  ```
2. Test a denied interaction using an invalid cookie
  * Given originAcceptingTraffic=true, originHitRate=0
  * Expect 'Wait please!'
    ```
    curl -X GET \
      http://<your_cloudfront_domain>/shop/index.html \
      -H 'Accept: */*' \
      -H 'Cache-Control: no-cache' \
      -H 'Connection: keep-alive' \
      -H 'Host: <your_cloudfront_domain>' \
      -H 'Postman-Token: aa876835-e5a8-491b-999c-23ed1d91f0dc,1304e21b-23f6-49dc-b6d0-bd05cd719ff8' \
      -H 'User-Agent: PostmanRuntime/7.11.0' \
      -H 'accept-encoding: gzip, deflate' \
      -H 'cache-control: no-cache' \
      -H 'cookie: premium-user-cookie=some-secret-cookie-value1' \
      -b premium-user-cookie=some-secret-cookie-value1
    ```

## Delete
1. Remove the files from S3
  ```
  aws s3 rm --recursive s3://mcwhirter-prioritization
  ```
2. Delete the website portion; this may take a while to complete
  ```
  aws cloudformation delete-stack \
    --stack-name visitor-prioritization-website \
    --region us-east-1
  ```
3. Lambda@Edge can only be deleted once CloudFront has deleted the versions. This can take up to an hour. After that, run this code to delete the function portion
  ```
  aws cloudformation delete-stack \
    --stack-name visitor-prioritization-function \
    --region us-east-1
  ```
