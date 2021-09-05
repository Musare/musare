# Configuration

## Backend
Location: `backend/config/default.json`

| Property | Description |
| --- | --- |
| `mode` | Should be either `development` or `production`. No more explanation needed. |
| `migration` | Should be set to true if you need to update DB documents to a newer version after an update. Should be false at all other times. |
| `secret` | Whatever you want - used by express's session module. |
| `domain` | Should be the url where the site will be accessible from, usually `http://localhost` for non-Docker. |
| `serverDomain` | Should be the url where the backend will be accessible from, usually `http://localhost/backend` for docker or `http://localhost:8080` for non-Docker. |
| `serverPort` | Should be the port where the backend will listen on, should always be `8080` for Docker, and is recommended for non-Docker. |
| `registrationDisabled` | If set to true, users can't register accounts. |
| `apis.youtube.key` | Can be obtained by setting up a [YouTube API Key](https://developers.google.com/youtube/v3/getting-started). You need to use the YouTube Data API v3, and create an API key. |
| `apis.recaptcha.secret` | Can be obtained by setting up a [ReCaptcha Site (v3)](https://www.google.com/recaptcha/admin). |
| `apis.recaptcha.enabled` | Keep at false to keep disabled. |
| `apis.github` | Can be obtained by setting up a [GitHub OAuth Application](https://github.com/settings/developers). You need to fill in some values to create the OAuth application. The homepage is the homepage of frontend. The authorization callback url is the backend url with `/auth/github/authorize/callback` added at the end. For example `http://localhost/backend/auth/github/authorize/callback`. |
| `apis.discogs` | Can be obtained by setting up a [Discogs application](https://www.discogs.com/settings/developers), or you can disable it. |
| `smtp` | Can be obtained by setting up an SMTP server, using a provider such as [Mailgun](http://www.mailgun.com/), or you can disable it. |
| `redis.url` | Should be left alone for Docker, and changed to `redis://localhost:6379/0` for non-Docker. |
| `redis.password` | Should be the Redis password you either put in your `startRedis.cmd` file for Windows, or `.env` for docker. |
| `mongo.url` | Needs to have the proper password for the MongoDB musare user, and for non-Docker you need to replace `@musare:27017` with `@localhost:27017`. |
| `cookie.domain` | Should be the ip or address you use to access the site, without protocols (http/https), so for example `localhost`. |
| `cookie.secure` | Should be `true` for SSL connections, and `false` for normal http connections. |
| `skipConfigVersionCheck` | Skips checking if the config version is outdated or not. Should almost always be set to false. |
| `skipDbDocumentsVersionCheck` | Skips checking if there are any DB documents outdated or not. Should almost always be set to false. |
| `configVersion` | Version of the config. Every time the template changes, you should change your config accordingly and update the configVersion. |

## Frontend
Location: `frontend/dist/config/default.json`

| Property | Description |
| --- | --- |
| `apiDomain` | Should be the url where the backend will be accessible from, usually `http://localhost/backend` for docker or `http://localhost:8080` for non-Docker. |
| `websocketsDomain` | Should be the same as the `apiDomain`, except using the `ws://` protocol instead of `http://` and with `/ws` at the end. |
| `frontendDomain` | Should be the url where the frontend will be accessible from, usually `http://localhost` for docker or `http://localhost:80` for non-Docker. |
| `frontendPort` | Should be the port where the frontend will be accessible from, should always be port `81` for Docker, and is recommended to be port `80` for non-Docker. |
| `recaptcha.key` | Can be obtained by setting up a [ReCaptcha Site (v3)](https://www.google.com/recaptcha/admin). |
| `recaptcha.enabled` | Keep at false to keep disabled. |
| `cookie.domain` | Should be the ip or address you use to access the site, without protocols (http/https), so for example `localhost`. |
| `cookie.secure` | Should be `true` for SSL connections, and `false` for normal http connections. |
| `siteSettings.logo` | Path to the logo image, by default it is `/assets/wordmark.png`. |
| `siteSettings.siteName` | Should be the name of the site. |
| `siteSettings.github` | URL of GitHub repository, defaults to `https://github.com/Musare/MusareNode`. |
| `skipConfigVersionCheck` | Skips checking if the config version is outdated or not. Should almost always be set to false. |
| `configVersion` | Version of the config. Every time the template changes, you should change your config accordingly and update the configVersion. |

## Docker Environment
Location: `.env`

| Property | Description |
| --- | --- |
| Ports | Will be how you access the services on your machine, or what ports you will need to specify in your nginx files when using proxy_pass. |
| `COMPOSE_PROJECT_NAME` | Should be a unique name for this installation, especially if you have multiple instances of Musare on the same machine. |
| `FRONTEND_MODE` | Should be either `dev` or `prod` (self-explanatory). |
| `MONGO_ROOT_PASSWORD` | Password of the root/admin user of MongoDB |
| `MONGO_USER_USERNAME` | Password for the "musare" user (what the backend uses) of MongoDB |