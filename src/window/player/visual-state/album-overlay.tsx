import * as React from 'react'
import { PlayerVisualState, SpotifyEvents, PlayerVisualStateId } from 'utils/types'
import { BaseOverlayState } from './base'
import { ProgressCircle } from 'react-desktop'
import { ipcRenderer } from 'electron'
import { PlayerAlbumInfo } from './album'

export class AlbumOverlayState extends BaseOverlayState implements PlayerVisualState {
    stateId = PlayerVisualStateId.Album

    render() {
        return this.renderWithOverlay(
            this.getState().album.name ? (
                <PlayerAlbumInfo album={this.getState().album} onAction={this.options.getOnAction()} />
            ) : (
                <ProgressCircle size={25} />
            )
        )
    }

    onEnter() {
        ipcRenderer.send(SpotifyEvents.AlbumInfo, this.getState().albumId)
        this.mouseHover = true
    }

    onExit() {
        this.mouseHover = false
    }
}
