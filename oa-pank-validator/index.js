#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { validateAPI } = require('./src/validator');
const { version } = require('./package.json');

// Configure CLI
program
  .version(version)
  .description('OA-Pank API Validator')
  .option('-u, --url <url>', 'API base URL', 'http://localhost:3001')
  .option('-f, --file <file>', 'OpenAPI specification file', './swagger.yaml')
  .option('-v, --verbose', 'Detailed output', false)
  .option('-t, --token <token>', 'JWT authentication token')
  .option('-c, --create-user', 'Create user and generate token automatically', false)
  .option('-s, --spec-only', 'Only validate specification without testing endpoints', false)
  .option('-e, --error-scenarios', 'Test additional error scenarios', true)
  // Eemaldatud skip-auth valik, kuna kõik endpointid peavad olema testitud
  .parse(process.argv);

const options = program.opts();

console.log(chalk.blue.bold('OA-Pank API Validator'));
console.log(chalk.gray(`Version: ${version}`));
console.log(chalk.gray(`API URL: ${options.url}`));
console.log(chalk.gray(`OpenAPI file: ${options.file}`));
console.log(chalk.gray(`Verbose output: ${options.verbose ? 'Yes' : 'No'}`));
console.log(chalk.gray(`Authentication: ${options.token ? 'Using provided token' : (options.createUser ? 'Creating user' : 'Without authentication')}`));
console.log(chalk.gray(`Validation mode: ${options.specOnly ? 'Specification only' : 'Full API validation'}`));
console.log(chalk.gray(`Error scenarios: ${options.errorScenarios ? 'Enabled' : 'Disabled'}`));
console.log();

// Prepare options for validator
const validatorOptions = {
  ...options,
  validateSpec: options.specOnly || options.errorScenarios
};

// Run validator
validateAPI(validatorOptions)
  .then(results => {
    console.log(chalk.green.bold('\nValidation results:'));
    
    // Show summary
    const { 
      totalEndpoints, 
      testedEndpoints, 
      passedEndpoints, 
      failedEndpoints, 
      issues 
    } = results;
    
    console.log(chalk.white(`Total endpoints: ${totalEndpoints}`));
    console.log(chalk.white(`Tested: ${testedEndpoints}`));
    console.log(chalk.green(`Passed: ${passedEndpoints}`));
    console.log(chalk.red(`Failed: ${failedEndpoints}`));
    // Kõik endpointid peavad olema testitud, skippimist ei lubata
    
    // Show issues by category
    if (issues.length > 0) {
      console.log(chalk.red.bold('\nIssues found:'));
      
      // Group issues by category
      const categorizedIssues = issues.reduce((acc, issue) => {
        if (!acc[issue.category]) {
          acc[issue.category] = [];
        }
        acc[issue.category].push(issue);
        return acc;
      }, {});
      
      // Show issues for each category
      Object.entries(categorizedIssues).forEach(([category, categoryIssues]) => {
        console.log(chalk.yellow.bold(`\n${category} (${categoryIssues.length}):`));
        
        categoryIssues.forEach(issue => {
          console.log(chalk.white(`  - ${issue.endpoint} (${issue.method.toUpperCase()}): ${issue.message}`));
          
          // More detailed output if verbose is enabled
          if (options.verbose && issue.details) {
            console.log(chalk.gray(`    Details: ${JSON.stringify(issue.details, null, 2)}`));
          }
        });
      });
    } else {
      console.log(chalk.green.bold('\nNo issues found!'));
    }
  })
  .catch(error => {
    console.error(chalk.red.bold('Validation error:'));
    console.error(chalk.red(error.message));
    if (options.verbose && error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  });
