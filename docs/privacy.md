---
title: Privacy Policy – HelloClub Plus
---

# Privacy Policy

`HelloClub Plus` is a Chrome extension that adds administrative features to
[HelloClub](https://helloclub.com). This policy explains what data the extension
accesses and how it is used.

## What data is accessed

The extension reads values that HelloClub stores in your browser's local storage
(authentication token, organisation ID, and profile ID) in order to make
authenticated requests on your behalf.

It uses those credentials to call the HelloClub API (`api-v2.helloclub.com`) to:

- Retrieve your organisation's configuration
- Fetch member check-in logs (member names and check-in times)
- Record check-out events

## What data is stored or shared

The extension does not store any data of its own and does not transmit any data
to any party other than the HelloClub API. All API requests go directly to
HelloClub's servers using your existing admin session.

## Who this extension is for

HelloClub Plus is intended for use by HelloClub administrators. It only
activates on `*.helloclub.com` pages.

## Contact

If you have questions, open an issue at
[github.com/smujmaiku/ext-helloclub-plus](https://github.com/smujmaiku/ext-helloclub-plus).
