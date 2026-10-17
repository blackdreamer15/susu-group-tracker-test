# Notes

## Assumptions

- The weekly contribution is the amount each member owes every week. The pot is that amount multiplied by the number of members. One member receives the whole pot.
- The recipient also pays the weekly contribution in the week they receive the pot. The recorded payout is the full pot.
- The process holds one group. Creating another group is rejected. Restarting the process deletes the group.
- A member's name is their id. Names are trimmed, and comparison ignores case, so `Camille` and `camille` are one member.
- Money is stored as integer pesewas. `50.00` is `5000`. Request and response amounts are decimal strings with at most two decimal places.
- A contribution is always recorded against the current week. The request does not choose a week. A new week sets every member's paid amount back to zero.
- Partial payments are allowed. A payment above the member's remaining balance is rejected and does not change that balance.
- The member list is open until the first payment of a round. It opens again after the last member in the list receives the pot, and it closes again at the next payment. A member added in that gap is placed at the end and owes the current week. The next recipient does not change.
- Payout order follows join order and repeats from the first member after the last member has been paid.
- A refused payout does not change the week, the balances, or the payout history.
- Members cannot be removed. The weekly contribution cannot be changed. The API does not transfer real money.

## Decisions

- Business rules live in `services/tracker.js`. Route handlers read the request and send the JSend success body. A thrown `AppError` is handled by `controllers/errorController.js`.
- Tests call the tracker and the money helper directly. They do not start the HTTP server.
- Routes are `/api/groups`, `/api/members`, `/api/contributions`, `/api/payouts`, and `/api/report`. The single group is implied, so the paths do not contain an id.

## With more time

- I would store the data in Postgres so a restart keeps the group, members, payments, and payouts.
- I would split that data into rows: a group holds the weekly contribution and the current week; a member belongs to the group and has a UUID, a name, and the time they joined; a contribution is one payment for a member and a week; a payout records the week, the recipient, and the amount. Sorting members by that time gives the payout order.
- I would keep the name as a label. The UUID would be the member id, so renaming someone would not change their payments or their place in the payout order.
- I would support more than one group, with the group id in the path.
- I would add authentication so only the organizer can record payments and payouts.
