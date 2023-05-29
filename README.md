# web-service

A simple web service for AtDex application

- build AMI
```
Packer build ami.prk.hcl
```

- create table
```
aws dynamodb create-table \
    --table-name test-events \
    --attribute-definitions AttributeName=UserID,AttributeType=S AttributeName=TransactionHash,AttributeType=S \
    --key-schema AttributeName=UserID,KeyType=HASH AttributeName=TransactionHash,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST
```

- delete table
```
aws dynamodb delete-table --table-name test-events --region us-east-1
```

- scan table
```
aws dynamodb scan --table-name test-events
```
