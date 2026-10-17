# Susu Group Tracker

A small HTTP API for one rotating savings group (susu).

Each member owes the same weekly contribution every week. The pot for a week is that amount times the number of members. When every member has paid in full, one member receives the whole pot. With a weekly contribution of `50.00` and three members, each person owes `50.00` and the pot is `150.00`.

The recipient pays their own contribution in that same week. The API records both the payment and the payout.

## Setup

Node.js 20 or newer, and pnpm.

```sh
pnpm install
cp .env.example .env
```

`.env` contains:

```text
PORT=5000
HOST=127.0.0.1
NODE_ENV=development
```

## Run

```sh
pnpm start:dev
```

This loads `.env` and restarts the process when a file changes. The server listens at `http://127.0.0.1:5000`.

`pnpm start` runs `node server.js` and does not load `.env`. Set `PORT` and `HOST` in the environment before using it.

Restarting the server clears the group.

## Test

```sh
pnpm test
```

This runs `node --test` on `tests/money.test.js` and `tests/tracker.test.js`. The tests call the money helper and the tracker directly. They cover partial payment and a payout that is refused because someone still owes.

## Rules

- One group exists at a time. A second `POST /api/groups` returns `409`.
- A member is added with `POST /api/members` and `{ "name": "Camille" }`. The name is the member's id. It is trimmed. `Camille` and `camille` are the same member.
- A contribution body is `{ "member": "Lucie", "amount": "30.00" }`. The server applies it to the current week. There is no week field.
- Amounts are JSON strings. `"50"`, `"50.5"`, and `"50.50"` are valid. A JSON number, an empty string, more than two decimal places, zero, and a negative amount return `400`.
- A member may pay part of the weekly amount. A payment larger than what that member still owes returns `409` and does not change the balance.
- `POST /api/payouts` takes an empty body. The server chooses the recipient. The order is the order members joined, and it repeats after the last member.
- If any member still owes, or the group has no members, the payout returns `409` and the week stays as it is.
- The member list accepts new members until the first payment of a round. It accepts them again only after the last member has received the pot, and only before the next payment. A new member is added at the end of the list and owes the current week.

## Endpoints

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| POST | `/api/groups` | `{ "weeklyContribution": "50.00" }` | 201 |
| POST | `/api/members` | `{ "name": "Camille" }` | 201 |
| POST | `/api/contributions` | `{ "member": "Lucie", "amount": "30.00" }` | 201 |
| POST | `/api/payouts` | empty | 201 |
| GET | `/api/report` | empty | 200 |

Every response is [JSend](https://github.com/omniti-labs/jsend).

A success response puts the result in `data`:

```json
{
  "status": "success",
  "data": {
    "week": 1,
    "member": "Camille",
    "amount": "150.00",
    "currentWeek": 2,
    "nextRecipient": "Pierre",
    "membershipOpen": false
  }
}
```

`membershipOpen` is `true` when a new member can be added.

A client error uses `status: "fail"` and puts the reason in `data`:

```json
{
  "status": "fail",
  "data": { "message": "A group already exists." }
}
```

| Status | When |
| --- | --- |
| 400 | The amount is not a valid money string, or the name is blank |
| 404 | No group exists yet, or the member name is unknown |
| 409 | The group already exists, the member name is already used, the member list is closed, the payment is above the amount owed, or the payout cannot be made |
| 500 | An unexpected server error. The body is `{ "status": "error", "message": "Something went very wrong!" }` |

When a payout is refused because someone still owes, `data.outstanding` lists those members. The current week, the balances, and the payout history stay unchanged.

```json
{
  "status": "fail",
  "data": {
    "message": "Week 1 is not fully paid.",
    "outstanding": [{ "member": "Lucie", "owes": "20.00" }]
  }
}
```

`GET /api/report` returns the current week, the weekly contribution, whether the member list is open, the next recipient, each member's `paid`, `owes`, and `paidInFull`, and the payout history from oldest to newest.

## Example

Camille, Pierre, and Lucie join in that order. The weekly contribution is `50.00`.

```sh
curl -s -X POST http://127.0.0.1:5000/api/groups \
  -H 'content-type: application/json' \
  -d '{"weeklyContribution":"50.00"}'

curl -s -X POST http://127.0.0.1:5000/api/members \
  -H 'content-type: application/json' \
  -d '{"name":"Camille"}'

curl -s -X POST http://127.0.0.1:5000/api/members \
  -H 'content-type: application/json' \
  -d '{"name":"Pierre"}'

curl -s -X POST http://127.0.0.1:5000/api/members \
  -H 'content-type: application/json' \
  -d '{"name":"Lucie"}'

curl -s -X POST http://127.0.0.1:5000/api/contributions \
  -H 'content-type: application/json' \
  -d '{"member":"Camille","amount":"50.00"}'

curl -s -X POST http://127.0.0.1:5000/api/contributions \
  -H 'content-type: application/json' \
  -d '{"member":"Pierre","amount":"50.00"}'

curl -s -X POST http://127.0.0.1:5000/api/contributions \
  -H 'content-type: application/json' \
  -d '{"member":"Lucie","amount":"30.00"}'

curl -s -X POST http://127.0.0.1:5000/api/payouts
```

That payout returns `409`. Lucie owes `20.00`. Week 1 has not changed.

```sh
curl -s -X POST http://127.0.0.1:5000/api/contributions \
  -H 'content-type: application/json' \
  -d '{"member":"Lucie","amount":"20.00"}'

curl -s -X POST http://127.0.0.1:5000/api/payouts

curl -s http://127.0.0.1:5000/api/report
```

The second payout returns `201`. Camille receives `150.00`. The current week is `2`. Pierre is the next recipient.
