---
title: Production Server Inventory & Access
category: systems
summary: Where our production systems live and how to get access to them.
tags: [infrastructure, access, production]
---
A running list of production systems and how to reach them. Keep this current — update it whenever a system is added, retired, or moved.

## Core systems

- **app-prod-01/02** — primary application servers, behind the load balancer.
- **db-prod-primary** — primary database; replicas at db-prod-replica-1/2.
- **bastion.internal** — the only host with direct SSH access to production; everything else is reached through it.

## Getting access

- Request access through the access-management tool, tagged with the system name and a reason.
- Access to `bastion.internal` requires manager approval and is reviewed quarterly.
- All production SSH keys are rotated every 90 days — you'll get a reminder before yours expires.

## Connecting

```
ssh -J bastion.internal app-prod-01
```

## Monitoring & alerts

- Dashboards: check the monitoring stack for current load, error rates, and latency.
- On-call is paged automatically for critical alerts; see the on-call rotation doc for the current schedule.

## Change management

Any change to a production system needs a ticket and a peer review, even for small config tweaks. Document what changed and why directly on the ticket.
