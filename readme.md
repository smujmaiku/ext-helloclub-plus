# HelloClub Plus

HelloClub is great. HelloClub is also missing a bunch of stuff. This fixes that.

## Features

### Check Out button

HelloClub lets you check members in from their profile page but not out. Add a
`Check Out` button next to the check-in button on any member profile. If the
member is currently checked in, the button appears. Click it, they're out.

## Installation

1. Clone this repo
2. Run `deno run build`
3. Go to `chrome://extensions`, enable `Developer mode`
4. Click `Load unpacked`, point it at the `helloclub-plus` directory
5. Browse to a member profile on `helloclub.com`

## Requirements

- Deno
- Chrome
- An admin account on `helloclub.com`
