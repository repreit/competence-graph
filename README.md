# competency-graph

A shared language for **inspectable competence**.

Competence is a **history** of **deeds** — not a credential, not a course completion.

This protocol does not deal with what must be hidden. If it should not be opened, it is not a deed. Leave it out. Nothing here is proven by concealment.

Demo: [https://repreit.github.io/competency-graph/](https://repreit.github.io/competency-graph/)

## Who this is for

Two seats. Both have to exist.

**Builder** — participates, ships, and accumulates a history. Someone who cares about Ethereum and web3, and wants professional competence — not a certificate. They work at home or wherever they learn. They need income and room for another dream.

**Requester** — opens that history in order to act: fund or entrust the next piece of work. A grant, a DAO, or a collaborator. Not an employer in the old sense.

The page is how a history is seen. This first context is Ethereum / web3.

**When this is used:** a Requester used to ask for a school name, a resume, a portfolio of claims. That is the old sitting. This protocol is for the moment that is not enough — open the history, inspect the deeds, then act: fund or entrust the next piece of work.

## Format (the MVP)

| File | What it is |
|---|---|
| [`codebase/history.json`](codebase/history.json) | Append-only deeds, one history per address |
| [`codebase/index.html`](codebase/index.html) | Reference viewer (no framework) |

**Deed:** inspectable. No inspectable proof → not a deed.
