# UserManagement Analysis

## Current structure:
- Line 7: imports Lock, Unlock, Shield, etc. - needs to add KeyRound
- Line 521-558: Actions column in users table - needs password change button
- Need to add a password change dialog within the users table
- The password input in add user dialog (line 326-332) uses standard Input component - looks fine

## Changes needed:
1. Add KeyRound import (line 7)
2. Add password change dialog state
3. Add password change button in actions column (after Shield button, line 556)
4. Add dialog component for password change
5. Use adminChangePassword mutation
