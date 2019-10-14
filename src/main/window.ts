import { BrowserWindow, app, ipcMain, LoadFileOptions } from 'electron'
import {
    APP_WINDOW_HEIGHT,
    APP_WINDOW_WIDTH,
    SPOTIFY_AUTH_SCOPE,
    SPOTIFY_AUTH_STATE,
    SPOTIFY_CALLBACK_URL,
    SPOTIFY_TOKEN_SERVER,
    SETTINGS_STORAGE_KEY,
    SETTINGS_DEFAULTS,
    INSTANCE_ID_STORAGE_KEY,
    SPOTIFY_TOKEN_REFRESH_INTERVAL,
} from '../utils/const'
import {
    SpotifyAuth,
    SpotifyPlaybackState,
    SpotifyMe,
    SpotifyPlaylist,
    SpotifyEvents,
    SpotifyRecentItem,
    SpotifyAlbum,
    Settings,
    SpotifyFavoriteList,
} from '../utils/types'
import { AppTray } from './tray'
import { SpotifyPlaylists } from './playlists'
import { spotifyApi } from '../utils/api'
import fetch from 'node-fetch'

let INSTANCE_ID = 'atz'

interface AppOptions {
    isDev: boolean
}

export class AppWindow {
    win: BrowserWindow
    basename: string
    tray: AppTray
    playlists: SpotifyPlaylists
    auth: SpotifyAuth
    me: SpotifyMe
    playbackState: SpotifyPlaybackState
    options: AppOptions
    refreshId: any

    constructor(options: AppOptions) {
        this.options = options
        this.basename = app.getAppPath() + '/'

        this.win = new BrowserWindow({
            width: APP_WINDOW_WIDTH,
            height: APP_WINDOW_HEIGHT,
            skipTaskbar: true,
            resizable: this.options.isDev,
            maximizable: this.options.isDev,
            minimizable: this.options.isDev,
            autoHideMenuBar: true,
            show: this.options.isDev ? true : false,
            webPreferences: {
                nodeIntegration: true,
            },
        })

        this.listenToEvents()

        this.listenToRedirects()

        this.setupTokenAutoRefresh()

        this.playlists = new SpotifyPlaylists()

        this.options.isDev && this.devSetup()

        this.authSpotify()
    }

    setupTokenAutoRefresh() {
        this.refreshId = setTimeout(async () => {
            if (this.auth.access_token) {
                await this.refreshToken()
            }
            this.setupTokenAutoRefresh()
        }, SPOTIFY_TOKEN_REFRESH_INTERVAL)
    }

    listenToEvents() {
        ipcMain.on(SpotifyEvents.SendList, (_event, type) => {
            this.win.webContents.send(SpotifyEvents.List, type || 'all', this.playlists.all)
        })

        ipcMain.on(SpotifyEvents.ApplySettings, async _event => {
            const settings = JSON.parse(await this.getItem(SETTINGS_STORAGE_KEY)) as Settings
            this.tray.applySettings(settings)
            this.win.hide()
        })

        ipcMain.on(SpotifyEvents.CancelSettings, _event => {
            this.win.hide()
        })

        this.win.on('close', event => {
            if (this.win.isVisible() && this.tray && !this.options.isDev) {
                event.preventDefault()
                this.win.hide()
            }
        })
    }

    async onLogout() {
        await this.setItem('SPOTIFY_AUTH', '')
        this.authSpotify()
    }

    onSettings() {
        this.win.show()
        if (this.win.webContents.getURL().indexOf('#settings') === -1) {
            this.goIndex({ hash: 'settings' })
        }
    }

    onPlaylistClick(list: SpotifyPlaylist) {
        this.saveFavorites(this.playlists.addFavorite(list.uri))

        this.tray.syncCurrentUri(list.uri)
        this.tray.refresh()

        spotifyApi.play({
            context_uri: list.uri,
        })
    }

    async initialize() {
        this.me = await spotifyApi.getMe().then(res => res.body)
        await this.loadPlaylists()
        await this.syncPlaybackState()
    }

    async loadPlaylists() {
        const [playlists, recent, albums] = await Promise.all([
            spotifyApi
                .getUserPlaylists(undefined, { limit: 50 })
                .then(res => res.body.items || [])
                .catch(_e => []) as Promise<SpotifyPlaylist[]>,
            spotifyApi
                .getMyRecentlyPlayedTracks({ limit: 50 })
                .then(res => res.body.items || [])
                .catch(_e => []) as Promise<SpotifyRecentItem[]>,
            spotifyApi
                .getMySavedAlbums({ limit: 50 })
                .then(res => res.body.items.map(one => one.album))
                .catch(_e => []) as Promise<SpotifyAlbum[]>,
        ])

        const db = (await this.getItem('SPOTIFY_FAVORITES')) || '[]'

        const favorites = JSON.parse(db) as any[]
        this.playlists.sync(playlists, favorites, recent, albums)
        if (!this.tray) {
            this.initTray()
        } else {
            this.tray.me = this.me
        }
        this.win.webContents.send(SpotifyEvents.List, 'all', this.playlists.all)
    }

    async initTray() {
        const settingsRaw = (await this.getItem(SETTINGS_STORAGE_KEY)) || JSON.stringify(SETTINGS_DEFAULTS)
        this.tray = new AppTray(this.win, this.playlists, JSON.parse(settingsRaw) as Settings, this.me, {
            onPlaylistClick: this.onPlaylistClick.bind(this),
            onSettings: this.onSettings.bind(this),
            onLogout: this.onLogout.bind(this),
        })
        this.tray.refresh()
    }

    async syncPlaybackState(touchFavorites: boolean = true) {
        this.playbackState = (await spotifyApi.getMyCurrentPlaybackState().then(res => res.body)) as SpotifyPlaybackState
        if (this.playbackState.is_playing && this.playbackState.context) {
            this.playbackState.context.uri = this.playbackState.context.uri
                .split(':')
                .slice(-3)
                .join(':')
            this.saveFavorites(this.playlists.addFavorite(this.playbackState.context.uri))
        }
        this.tray.syncState(this.playbackState)
    }

    async authSpotify() {
        this.goIndex({ hash: 'loading' })
        const authRaw = await this.getItem('SPOTIFY_AUTH')
        this.auth = JSON.parse(authRaw || JSON.stringify({ access_token: '' }))

        if (this.auth.access_token) {
            await this.refreshToken()
        } else {
            this.goAuthSpotify()
        }
    }

    goAuthSpotify() {
        this.win.loadURL(spotifyApi.createAuthorizeURL(SPOTIFY_AUTH_SCOPE, SPOTIFY_AUTH_STATE))
        this.win.setSize(800, 600)
        this.win.show()
    }

    async listenToRedirects() {
        INSTANCE_ID = await this.generateInstanceId()
        this.win.webContents.on('will-redirect', (event, newUrl) => {
            if (newUrl.indexOf(`${SPOTIFY_CALLBACK_URL}?code=`) !== -1) {
                event.preventDefault()
                const code = newUrl.split(`${SPOTIFY_CALLBACK_URL}?code=`)[1].split('&')[0]
                fetch(`${SPOTIFY_TOKEN_SERVER}auth?code=${code}&id=${INSTANCE_ID}`)
                    .then(res => res.json())
                    .then(body => {
                        if (!body.success) {
                            this.goIndex({ hash: 'SERVER_ERROR' })
                        } else {
                            this.win.hide()
                            this.win.setSize(APP_WINDOW_WIDTH, APP_WINDOW_HEIGHT)
                            this.goIndex({ hash: 'settings' })
                            this.syncAuth(body)
                            this.initialize()
                        }
                    })
                    .catch(_e => {
                        this.goIndex({ hash: 'SERVER_ERROR' })
                    })
            }
        })
    }

    async generateInstanceId() {
        let id = await this.getItem(INSTANCE_ID_STORAGE_KEY)
        if (!id) {
            id = 'spotify-pal-' + Math.round(10000 + Math.random() * 100000)
            this.setItem(INSTANCE_ID_STORAGE_KEY, id)
        }
        return id
    }

    goIndex(options: LoadFileOptions = {}) {
        this.win.loadFile('index.html', options)
    }

    async refreshToken(intialize: boolean = true) {
        if (!this.auth.access_token) {
            return Promise.resolve(false)
        }
        return await fetch(`${SPOTIFY_TOKEN_SERVER}refresh?id=${INSTANCE_ID}`)
            .then(res => res.json())
            .then(body => {
                if (!body.success) {
                    this.goAuthSpotify()
                } else {
                    this.syncAuth(body)
                    intialize && this.initialize()
                }
            })
            .catch(_e => {
                this.goIndex({ hash: 'SERVER_ERROR' })
            })
    }

    syncAuth(body: any) {
        spotifyApi.setAccessToken(body.access_token)
        this.auth.access_token = body.access_token
        this.setItem('SPOTIFY_AUTH', JSON.stringify(body))
    }

    devSetup() {
        const elemon = require('elemon')
        elemon({
            app: app,
            mainFile: 'electron.js',
            bws: [{ bw: this.win, res: ['bundle.js', 'index.html'] }],
        })
    }

    setItem(item: string, value: string) {
        this.win.webContents.executeJavaScript(`localStorage.setItem('${item}','${value}')`)
    }

    getItem(item: string) {
        return this.win.webContents.executeJavaScript(`localStorage.getItem('${item}')`)
    }

    saveFavorites(favs: SpotifyFavoriteList[]) {
        this.setItem('SPOTIFY_FAVORITES', JSON.stringify(favs))
    }
}
