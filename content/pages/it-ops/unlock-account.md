---
title: Resetting a Locked User Account
category: it-ops
summary: Steps to verify identity and unlock an account after repeated failed logins.
tags: [active-directory, accounts, helpdesk]
---
Locked accounts are the most common helpdesk ticket. Follow these steps in order and don't skip identity verification, even for people you recognize.

## 1. Verify identity

- Confirm the request came in through the ticketing system or a verified company phone/Slack — never act on a bare email claiming to be the user.
- Ask for employee ID or manager's name if anything feels off.

## 2. Check why it locked

```
Get-ADUser -Identity <username> -Properties LockedOut, BadLogonCount, LastBadPasswordAttempt
```

A handful of bad attempts around the same time is normal (expired password, new device). A long, steady stream over hours can mean something else — escalate to Security instead of unlocking.

## 3. Unlock the account

```
Unlock-ADAccount -Identity <username>
```

If the password itself is expired, issue a temporary password and set **"User must change password at next logon."**

## 4. Confirm and close

- Ask the user to log in while you're still on the call or chat.
- Log the ticket with the cause (expired password, forgotten password, brute-force attempt, etc.).

## Escalate instead of unlocking when

- Failed attempts came from an unfamiliar location or country.
- The user says they weren't trying to log in at all.
- This is the third lockout for the same account this week.
