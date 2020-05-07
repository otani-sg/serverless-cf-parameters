let parseArgs = require('yargs-parser')

module.exports = class CfParametersPlugin {
    constructor (serverless, options) {
        this.serverless = serverless
        this.provider = serverless ? serverless.getProvider('aws') : null
        this.options = options
        this.commands = {
            deploy: {
                options: {
                    'parameter-overrides': {
                        usage: 'Update the cloudformation parameters\' values',
                        required: false
                    }
                }
            }
        }
        this.providerRequest = this.provider.request.bind(this.provider)

        this.hooks = {
            'before:deploy:deploy': this.interceptProviderRequest.bind(this),
            'aws:deploy:deploy:checkForChanges': this.preventSkippingDeployment.bind(this)
        }
    }

    interceptProviderRequest () {
        this.provider.request = async (...args) => {
            let [service, method, params] = args
            let compiledParametersTemplate = this.serverless.service.provider.compiledCloudFormationTemplate.Parameters || {}

            if (service === 'CloudFormation' && method === 'updateStack') {
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
        if (this.options.parameterOverrides) {
            if (this.serverless.service.provider.shouldNotDeploy === true) {
                this.serverless.service.provider.shouldNotDeploy = false
                this.serverless.cli.log('Cloudformation parameters\' values specified. Reversed skipping deployment decision.')
            }
        }
    }
    
    getOverrides () {
        // Return early
        if (!this.options.parameterOverrides) {
            return {}
        }
        
        // Normalize values into array
        let parameterOverrides = this.options.parameterOverrides
        if (!Array.isArray(parameterOverrides)) {
            parameterOverrides = [parameterOverrides]
        }
        
        return parseArgs(parameterOverrides.map(param => `--${param}`).join(' '))
    }
}
