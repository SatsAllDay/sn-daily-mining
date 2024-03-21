# sn-daily-mining

A small, TypeScript project which has thin APIs for interacting with the BraiinsPool and stacker.news APIs and uses them to make posts and comments to share my daily mining earnings.

The BraiinsPool and stacker.news libraries here _could_, in theory, serve as the basis for a TypeScript library used to interact with these services, should I or anyone else have the time to build them out.

## Setup

1. Create a `.env` file (`gitignored`) in the root of the repo with the following entries:

   `BRAIINS_TOKEN` - this is the API token from BraiinsPool used to access their API. You can get this from your Braiins account.

   `SN_API_KEY` - this is the API Key from Stacker News used to access their API. You must request this feature to be enabled on your account before generating a key.

## Contributing

Feel free to fork this repo, but I do not intend to accept PRs. It is shared as a reference more than anything else.

## License

This project is [MIT licensed](./LICENSE).
