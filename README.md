# competency-graph

A shared language for **checkable competence**.

Competency is a history of participation and doing — not a badge, not a course completion. A **field** is a filter over that history. It does not issue a title.

Demo: [https://repreit.github.io/competency-graph/](https://repreit.github.io/competency-graph/)

## Who this is for

Two seats. Both have to exist.

**Builder** — participates, ships, and accumulates a history. Someone who cares about Ethereum and web3, and wants professional competence — not a course badge. They work at home or wherever they learn. They need income, a map of the new landscape, and room for another dream.

**Requester** — inspects that history in order to act: fund, collaborate, or entrust the next piece of work. A protocol, a grant, a DAO, or a collaborator. Not a spectator. Not an employer in the old sense.

The graph is the language between them. Other fields can use the same format later. This first graph is that Ethereum / web3 context.

**When this is used:** a requester used to ask for a school name, a resume, a portfolio of claims. That is the old filter. This graph is for the moment that is not enough — inspect what the builder actually did, then act: fund, collaborate, or entrust the next piece of work.

## Why this exists

One team cannot write every field (nursing, Solidity, design, law, real estate). The public good is the **format**, plus one reference viewer. Anyone can publish a history, and a field as a filter, later as JSON.

This is closer to Vitalik’s history-you-cannot-sell than to a ladder of badges. Soul or worldview may be inferred from results. They are not labels in the format. Personality is not represented.

## Format (the MVP)

| File | What it is |
|---|---|
| [`codebase/history.json`](codebase/history.json) | One person’s append-only deeds |
| [`codebase/filter.json`](codebase/filter.json) | Fields as filters: which history counts here |
| [`codebase/index.html`](codebase/index.html) | Reference viewer (no framework) |

**History entry:** inspectable participation or doing. No inspectable proof → not an entry.

**Filter node:** illegal without saying what history would satisfy it.

**Edges:** a link, not an unlock. `bridge` marks a cross-field link. The structure is a network.

Optional later: `{ easUid?, did? }` on a history entry. No wallet in this MVP.

## Example

Mina’s history. The page loads her deeds from JSON. Click a deed for the photo and the proof. Pick a field to see which deeds count there.

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
