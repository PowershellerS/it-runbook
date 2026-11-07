---
title: "BarTender KB Article"
category: getting-started
summary: ""
tags: []
---
KNOWLEDGE BASE ARTICLE
 BarTender Login Failure Resolution
 KB0010492
 CATEGORY
 Enterprise Apps
 TARGET AUDIENCE
 Help Desk L1/L2
 LAST UPDATED
 Oct 15, 2026
 STATUS
 Published
 ISSUE SUMMARY
 Users experience authentication failures or access denied errors when attempting to log into   BarTender .
This typically occurs following a password change or credential update on their domain account
(   rz/username   ).
 ROOT CAUSE
 BarTender authentication relies directly on Active Directory credentials mapped to the   rz/   domain account.
When a user's password is updated across the network (e.g., via Triathlon domain updates), local cached
credentials or active sessions become out of sync.
 RESOLUTION WORKFLOW
 Prerequisites:   Active Directory Users & Computers (ADUC) access using an elevated   t1   administrator account.
 1   Access Active Directory
 Launch Active Directory Users and Computers (ADUC). When prompted for credentials, authenticate
using your elevated   t1   account.
 2   Reset User Password
 Locate the user's account (   rz/username   ), right-click, and select   Reset Password . Assign a new
compliant temporary password.
 3   Re-authenticate BarTender Session
 Have the user close all active BarTender windows, relaunch the application, and log in using
 rz/username   along with the newly reset password.
 ESCALATION PATH
 If authentication continues to fail:
 1. Verify client workstation VPN / network connection to domain controllers.
2. Con fi rm the BarTender Licensing Server (BLS) is reachable from the endpoint.
3. Escalate ticket to   L2 Enterprise Systems   for policy sync inspection.
 IT Helpdesk Documentation • Internal Use Only   Page 1 of 1