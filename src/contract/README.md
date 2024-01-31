# Manifests / Contracts

## Contract Execution Phases
During execution a contract may traverse through the following execution stages, and 

### Template Phase
The contents of the contract is a raw template that may contain 0 or more references to other contracts. Before a contract can "execute" according to its rules, all contract references and embedded contracts must be sufficiently executed. 

Contracts that can turn their template into a valid JSON object will then be able to apply its own execution rules to enter the "Definition Phase". If any contract with dependencies advances from one phase to the next, the containing contract will return to the "Template Phase" and re-apply its transformations using the new 

### Definition Phase
A contract is in the "Definition Phase" if it has transformed its computed template according to its transformation rules. For non-async contracts, this will be the final shape for that contract that will reach the response. Contract types with an additional async "Evaluation Phase" will use the transformed definition as an input for its final transformation step.

### Evaluation Phase
A contract that is capable of performing some additional asynchronous operation (such as a mutation or external fetch) have a final Evaluation Phase and a condition to run. Until this condition is met, a contract with an Evaluation Phase can return to the Template Phase if any of its dependent contracts gets re-calculated. If the condition is met, the contract will begin asynchronous evaluation, after which point the results of the contract will be locked in place, regardless of any further changes to its dependents or other inputs.

