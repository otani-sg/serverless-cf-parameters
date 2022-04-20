let parseArgs = require('yargs-parser')
const OPTION_PARAMETER_OVERRIDES = 'parameter-overrides'

module.exports = class CfParametersPlugin {
    constructor (serverless, options) {
        this.serverless = serverless
        this.provider = serverless ? serverless.getProvider('aws') : null
        this.options = options
        this.commands = {
            deploy: {
                options: {
                    [OPTION_PARAMETER_OVERRIDES]: {
                        usage: 'Update the cloudformation parameters\' values',
                        required: false,
                        // support multiple option of command
                        type: 'multiple'
                    }
                }
            }
        }
        this.providerRequest = this.provider.request.bind(this.provider)

        this.hooks = {
            // this command for Serverless Framework from version 2.* and earlier
            'before:deploy:deploy': this.interceptProviderRequest.bind(this),
            // this command for Serverless Framework from version 3.* onwards
            'before:aws:deploy:deploy:updateStack': this.interceptProviderRequest.bind(this),
            'aws:deploy:deploy:checkForChanges': this.preventSkippingDeployment.bind(this)
        }
    }

    interceptProviderRequest () {
        this.provider.request = async (...args) => {
            let [service, method, params] = args
            let compiledParametersTemplate = this.serverless.service.provider.compiledCloudFormationTemplate.Parameters || {}

            if (service === 'CloudFormation' && (method === 'updateStack' || method === 'createChangeSet')) {
                // Get list of parameters in currently deployed template
                let response = await this.providerRequest('CloudFormation', 'getTemplate', {StackName: params.StackName})
                let currentParameters = JSON.parse(response.TemplateBody).Parameters || {}

                // Build list of parameters
                const overrides = this.getOverrides()
                params.Parameters = Object.keys(compiledParametersTemplate).map((paramKey) => {
                    // If parameter value aws was defined then we set its value directly
                    if (overrides[paramKey] !== undefined) {
                        return {
                            ParameterKey: paramKey,
                            ParameterValue: overrides[paramKey]
                        }
                        // If parameter in new template already exists in old template then we reuse value from previous template
                    } else if (currentParameters[paramKey]) {
                        return {
                            ParameterKey: paramKey,
                            UsePreviousValue: true
                        }
                    }
                    // Otherwise define nothing to use default value
                }).filter(_ => _)
            }

            return await this.providerRequest(...args)
        }
    }

    preventSkippingDeployment () {
        if (this.options[OPTION_PARAMETER_OVERRIDES]) {
            if (this.serverless.service.provider.shouldNotDeploy === true) {
                this.serverless.service.provider.shouldNotDeploy = false
                this.serverless.cli.log('Cloudformation parameters\' values specified. Reversed skipping deployment decision.')
            }
        }
    }
    
    getOverrides () {
        // Return early
        if (!this.options[OPTION_PARAMETER_OVERRIDES]) {
            return {}
        }
        
        // Normalize values into array
        let parameterOverrides = this.options[OPTION_PARAMETER_OVERRIDES]
        if (!Array.isArray(parameterOverrides)) {
            parameterOverrides = [parameterOverrides]
        }
        
        return parseArgs(
            parameterOverrides.map(param => `--${param}`).join(' '),
            // Do not attempt to auto-convert numbers, since CF parameters' values are always string
            {configuration: {'parse-numbers': false}}
        )
    }
}
