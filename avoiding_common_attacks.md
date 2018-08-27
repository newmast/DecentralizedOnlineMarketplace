# Avoiding common attacks

## Inline `require()` statements
The contract uses various `require()` statements to assess the current state. This prevents
malicious parameters which improves security.

## Integer arithmetic overflow / underflow

When depositing or withdrawing funds the contract makes sure there is no overflow / underflow.

## There are written tests. 
This ensures the functionality works.

## Gas limit

The contract does not use loops to read through arrays.
