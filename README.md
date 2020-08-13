# CloudFormation Parameters Plugin for Serverless

Serverless plugin for setting CloudFormation parameters values using the same `--parameter-overrides` flag that AWS CLI uses

## Install

```bash
$ npm i -D https://github.com/otani-sg/serverless-cf-parameters.git
```

```yaml
# serverless.yaml
plugins:
- serverless-cf-parameters
```

## Usage

Declare **Parameters** section as you usually would in a CloudFormation template.

```yaml
# ...
resources:
  Resources:
    # ...
  Parameters:
    InstanceType:
      Type: String
      Default: t2.micro
    DiskSize:
      Type: String
```

When deploy, use `--parameter-overrides` to set the parameters' values:

```bash
$ sls deploy --parameter-overrides InstanceType=t2.small --parameter-overrides DiskSize=15GB
```

The parameters' values will be re-used in next deployment if no override is specified, which is the same behavior with AWS CLI `deploy` command.