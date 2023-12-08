# Contracts

## File Structure

The Contract Library has a fixed file structure that keeps the specific functions of contract modules together (a more detailed description of individual contract types and their behaviors will be provided in the contract execution section). The file hierarchy is as follows:

- **Type:** Defined contract types may have distinct execution behavior or specific rules on validating the structure. Typically this will describe the general shape and purpose of a contract as one of a number of pre-defined units or modules at the top level, but contracts may feature different substitution objects that make the static JSON appear different.
- **Name:** At this level, any folder or file corresponds to the name of the contract for the purpose of referencing it in a manifest. JSON files at this level are treated as the "default" version of that contract. 
- **Version:** Contracts that have multiple versions under the same name are stored as a directory containing a JSON file for each unique version. Directories should at a minimum include one default.json file to describe the unversioned behavior.

Contracts can be saved with a conventional `.json` file extension if they are static definitions that will always be executed the same when referenced. Optionally, a contract can be stored with a `.json.handlebars` extension to permit dynamic contract definitions (discussed below).

```
flows
└── contracts
    └── {type}
        ├── {name}.json[.handlebars]
        └── {name}
            ├── default.json[.handlebars]
            └── {version}.json[.handlebars]
```

## Definitions and Execution
All contracts stored in this file structure are building blocks for defining the configuration of some behavior of a representation or a mutation, regardless of the current state of an application or the end user. A contract is "executed" when that definition is used in conjunction with a set of inputs to produce a transformed output. These input properties include:

- **Request Characteristics:** This includes the request method, targeted product, the use-case, an application ID, and any authorization headers received as part of an incoming request
- **Manifest:** Contracts that reference other contracts in place of part of their own definition do so through the shared manifest. These are selected by the request characteristics
- **Application:** If an application ID is included in the request characteristics, it will be used to obtain the current application details from Application Service

The default contract behavior is to return the definition as-is (or in the case of templated contracts, as rendered); these are called "Identity" contracts. Additional contract types may specify a specific process for how to transform the definition and aforementioned inputs. A specific ContractType should be defined for:

1. A complex or commonly used transformation from definition to output. (e.g. running validations or populating arrays of error messages)
2. A contract for a mutation that has additional side-effects in addition the the normal contract execution.

## Dynamic Contracts
If a contract is stored as a `.json.handlebars` file, it can take advantage of [Handlebars templating features](https://handlebarsjs.com/guide/). Although Handlebars is normally an HTML templating solution, it has been adapted to template JSON contracts with [handlebars-a-la-json](https://www.npmjs.com/package/handlebars-a-la-json). This adaptation does have slight variations from normal Handlebars.

### Helpers
To aid in writing contract definitions using handlebars, a number of additional helpers have been provided to aid in writing concise and readable definitions.

#### contract
The `contract` helper will place the contents of the fully executed contract specified as the first parameter. The substitution key provided must match up to a substitution key that exists in the manifest, otherwise the substitution will fail

**NOTE:** The contract being substituted will be a fully qualified JSON string that we want inserted into the template verbatim, so always specify this helper using the [triple-stash](https://handlebarsjs.com/guide/#html-escaping) convention to prevent any of the characters from being escaped.

Imagine we have the following manifest:

```
{
  "*": "student.v1",
  "name_input": "input_name.v1",
  "email_input": "input_email.v1",
  "address_input": "input_address.v1"
}
```
Inside the `student.v1` contract, we can now reference each of the left-hand substitution keys inside of that contract, and they will be replaced with the contracts they reference.

```
{
  "stage": "student",
  "steps": [
    {{{ contract 'name_input' }}},
    {{{ contract 'email_input' }}},
    {{{ contract 'address_input' }}},
  ]
}
```

#### list
The `list` block helper can be applied around a number of individual JSON objects or contract references to provide a convenient way of grouping an unknown number of elements into a single array. For ordinary usage, specify an array of elements like this:

```
{{#list}}
  {{#unless application.email}}
    { "key": "email" }
  {{/unless}}
  {{#unless application.name}}
    { "key": "name" }
  {{/unless}}
{{/list}}
```

Optional or conditional elements that appear will automatically be combined into array elements without risking JSON parse errors.

This block helper can also be used to merge together arrays from different sources. Imagine we have the following manifest:

```
{
  "*": "student.v2",
  "steps": [
    "input_name.v1",
    "input_email.v1",
    "input_address.v2"
  ],
  "submit_action": "est_orig_submit.v1"
}
```

We can now write `student.v2` to include this variable number of steps:

```
{
  "stage": "student",
  "steps": 
    {{#list}}
      { "type": "header", "content": "This header is always here regardless of steps" }
      {{{ contract 'steps' }}}
      { "type": "action", "action": {{{ contract 'submit_action' }}}}
    {{/list}}
}
```

Regardless of how many steps end up being substituted in place of the `steps` contract, the `list` block helper will flatten it out so the executed contract includes each of them betwen the "header" and "action" objects

