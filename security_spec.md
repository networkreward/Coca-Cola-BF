# Security Specification

## Data Invariants
1. Users cannot modify their own balance.
2. Users can only read their own data.
3. Transactions must reference a valid user ID.
4. Transaction status cannot be modified by the user.

## Dirty Dozen Payloads (Expect PERMISSION_DENIED)
1. User updates balance field for their own document.
2. User sets `role` to 'ADMIN'.
3. User creates a transaction with a different `userId`.
4. Transaction with negative amount.
5. Transaction with non-existent `userId`.
6. User deletes their own transaction document.
7. User updates status of transaction to 'SUCCESS'.
8. User injects 5MB string into `name` field.
9. User attempts to read another user's document.
10. Transaction creation with missing `type`.
11. Transaction creation with invalid `type`.
12. User creates a transaction document with a random ID that is too long.
