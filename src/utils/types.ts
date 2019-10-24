import { BrowserWindowConstructorOptions, BrowserWindow, LoadFileOptions } from 'electron'

export interface SpotifyTrackFeatures {
    acousticness: number
    analysis_url: string
    danceability: number
    duration_ms: number
    energy: number
    id: string
    instrumentalness: number
    key: number
    liveness: number
    loudness: number
    mode: number
    speechiness: number
    tempo: number
    time_signature: number
    track_href: string
    type: string
    uri: string
    valence: number
}

export interface SpotifyImage {
    url: string
    height: number
    width: number
}

export interface Settings {
    max_size: string
    order_recent_playlist: string
    order_playlists: string
    lunch_at_login: boolean
    playlist: string
}

export interface SpotifyArtist {
    name: string
    uri: string
    id: string
    type: string
    genres: string[]
    images: SpotifyImage[]
    popularity: number
    followers: { url: string; total: number }
    external_urls: any[]
}

export interface SpotifyAlbum {
    uri: string
    release_date: string
    release_date_precision: string
    type: string
    name: string
    label: string
    popularity: number
    images: SpotifyImage[]
    album_type: string
    id: string
    total_tracks: number
    artists: SpotifyArtist[]
    genres: string[]
    tracks: {
        items: SpotifyTrack[]
        total: number
    }
}

export interface SpotifyTrack {
    type: string
    uri: string
    name: string
    id: string
    preview_url: string
    artists: SpotifyArtist[]
    album: SpotifyAlbum
    duration_ms: number
    explicit: boolean
    is_local: boolean
    is_playable: boolean
    popularity: number
    track_number: number
}

export interface SpotifyRecentItem {
    played_at: string
    track: SpotifyTrack
    context: {
        type: string
        uri: string
    }
}

export interface SpotifyMe {
    display_name: string
    email: string
    external_urls: {
        spotify: string
    }
    id: string
    images: SpotifyImage[]
    product: string
    type: string
    uri: string
}

export interface SpotifyPlaylist {
    id: string
    name: string
    uri: string
    images: SpotifyImage[]
    tracks: { total: number; href: string }
    total_tracks: number
    owner: {
        id: string
        uri: string
        display_name: string
    }
}

export interface SpotifyPlaybackState {
    context: {
        type: string
        uri: string
    }
    originContextUri: string
    is_playing: boolean
    shuffle_state: boolean
    repeat_state: 'off' | 'context'
    item: SpotifyTrack
    device: {
        id: string
        is_active: boolean
        name: string
        type: string
        volume_percent: number
    }
    progress_ms: number
    currently_playing_type: string
}

export interface SpotifyFavoriteList {
    uri: string
    count: number
    ts: any
}

export interface SpotifyAuth {
    success: boolean
    access_token: string
    scope: string
}

export enum SpotifyEvents {
    Me = 'SPOTIFY-ME',
    List = 'SPOTIFY-LIST',
    State = 'SPOTIFY-STATE',
    Menu = 'SPOTIFY-SYNCMENU',
    Play = 'SPOTIFY-PLAY',
    Next = 'SPOTIFY-NEXT',
    Prev = 'SPOTIFT-PREV',
    Pause = 'SPOTIFY-PAUSE',
    Rewind = 'SPOTIFY-REWIND',
    Settings = 'SPOTIFY-SETTINGS',
    SendList = 'SPOTIFY-SEND-LIST',
    SendState = 'SPOTIFY-SEND-STATE',
    SendMe = 'SPOTIFY-SEND-ME',
    ApplySettings = 'SPOTIFY-APPLY-SETTINGS',
    CancelSettings = 'SPOTIFY-CANCEL-SETTINGS',
    ToggleShuffle = 'SPOTIFY-TOGGLE-SHUFFLE',
    ToggleRepeat = 'SPOTIFY-TOGGLE-REPEAT',
    ArtistInfo = 'SPOTIFY-ARTIST-INFO',
    AlbumInfo = 'SPOTIFY-ALBUM-INFO',
    TrackInfo = 'SPOTIFY-TRACK-INFO',
    PlayContextURI = 'SPOTIFY-PLAY-CONTEXT-URI',
    PlayGenre = 'SPOTIFY-PLAY-GENRE',
}

export enum BrowserState {
    Settings = 'settings',
    Player = 'player',
    Index = 'index',
}

export enum PlayerAction {
    Play = 'PLAYER-PLAY',
    Next = 'PLAYER-NEXT',
    Prev = 'PLAYER-PREV',
    Pause = 'PLAYER-PAUSE',
    Rewind = 'PLAYER-REWIND',
    ToggleShuffle = 'PLAYER-TOGGLE-SHUFFLE',
    ToggleRepeat = 'PLAYER-TOGGLE-REPEAT',
    PlayContextURI = 'PLAYER-PLAY-CONTEXT-URI',
    PlayGenre = 'PLAYER-PLAY-GENRE',
}

export interface AppBrowserOptions extends LoadFileOptions {
    position?: { x: number; y: number }
    hidden?: boolean
}

export interface AppBrowserState {
    stateId: string
    config: BrowserWindowConstructorOptions
    win: BrowserWindow
    onExit: () => void
    onEnter: (options?: AppBrowserOptions, refresh?: true) => void
    auth: (url: string) => void
}

export enum PlayerMode {
    Track = 'PLAYER-MODE-TRACK',
    Artist = 'PLAYER-MODE-ARTIST',
}

export enum PlayerVisualStateId {
    Default = 'DEFAULT',
    Artist = 'ARTIST',
    Album = 'ALBUM',
    Track = 'TRACK',
}

export interface PlayerVisualState {
    stateId: PlayerVisualStateId
    render: () => React.ReactNode
    onEnter: () => void
    onExit: () => void
    mouseHover: boolean
}
