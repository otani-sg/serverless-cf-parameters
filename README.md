# CloudFormation Parameters Plugin for Serverless

[![npm (scoped)](https://img.shields.io/npm/v/@otani.sg/serverless-cf-parameters)](https://www.npmjs.com/package/@otani.sg/serverless-cf-parameters)
[![npm](https://img.shields.io/npm/dw/@otani.sg/serverless-cf-parameters)](https://www.npmjs.com/package/@otani.sg/serverless-cf-parameters)
[![NPM](https://img.shields.io/npm/l/@otani.sg/serverless-cf-parameters)](https://www.npmjs.com/package/@otani.sg/serverless-cf-parameters)

Serverless plugin for setting CloudFormation parameters values using the same `--parameter-overrides` flag that AWS CLI uses

## Install

```bash
$ sls plugin install -n @otani.sg/serverless-cf-parameters
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
