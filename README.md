# competency-graph

A shared language for **inspectable competence**.

Competence is a **history** of **deeds** — not a credential, not a course completion. A **filter** over that history does not issue a credential. It says which deeds count here.

Demo: [https://repreit.github.io/competency-graph/](https://repreit.github.io/competency-graph/)

## Who this is for

Two seats. Both have to exist.

**Builder** — participates, ships, and accumulates a history. Someone who cares about Ethereum and web3, and wants professional competence — not a certificate. They work at home or wherever they learn. They need income, a map of the new landscape, and room for another dream.

**Requester** — opens that history in order to act: fund or entrust the next piece of work. A protocol, a grant, a DAO, or a collaborator. Not a spectator. Not an employer in the old sense.

The page is how a history is seen. Other filters can use the same format later. This first context is Ethereum / web3.

**When this is used:** a Requester used to ask for a school name, a resume, a portfolio of claims. That is the old sitting. This protocol is for the moment that is not enough — open the history, inspect the deeds, then act: fund or entrust the next piece of work.

## Why this exists

One team cannot write every filter (nursing, Solidity, design, law, real estate). The public good is the **format**, plus one reference viewer. Anyone can publish a history, and a filter, later as JSON.

This is closer to Vitalik’s history-you-cannot-sell than to a ladder of credentials. Soul or worldview may be inferred from results. They are not labels in the format. Personality is not represented.

## Format (the MVP)

| File | What it is |
|---|---|
| [`codebase/history.json`](codebase/history.json) | Append-only deeds, one history per address |
| [`codebase/filter.json`](codebase/filter.json) | Filters: which deeds count here |
| [`codebase/index.html`](codebase/index.html) | Reference viewer (no framework) |

**Deed:** inspectable. No inspectable proof → not a deed.

**Filter:** illegal without saying which deeds would count.

**Edges:** a link, not an unlock. The structure is a network.

A deed may carry `extra` for the viewer. It is not the format.

Optional later: `{ easUid?, did? }` on a deed. No wallet in this MVP.

## Example

Two histories, same filters. Click a deed for the photo and the proof. Pick an address, then a filter, to see which deeds count there.

## Run locally

GitHub Pages serves `codebase/`. Opening `index.html` as a file may block JSON fetch.

```bash
cd codebase
python3 -m http.server 4173
```

Then open http://localhost:4173/

Push to `main` to update the live demo.

## Not in this MVP

Wallet, EAS writes, login, marketplace, grant application UI, real on-chain verification.
