import { SPOTIFY_CLIENT_ID } from '../env'
import { SPOTIFY_CALLBACK_URL } from './const'

const SpotifyWebApi = require('spotify-web-api-node')

export const spotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    redirectUri: SPOTIFY_CALLBACK_URL
})
