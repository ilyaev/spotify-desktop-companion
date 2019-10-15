const express = require('express')
const app = express()
const port = 3002
const env = require('./server.env.js')
const SpotifyWebApi = require('spotify-web-api-node')

const spotifyApi = new SpotifyWebApi({
    clientId: env.clientId,
    redirectUri: env.redirectUrl,
    clientSecret: env.clientSecret,
})

const dbClass = () => {
    const data = {}
    return {
        storeItem: (item, d) => {
            data[item] = d
        },
        loadItem: item => {
            return data[item] || {}
        },
    }
}

const db = dbClass()

app.get('/auth', (req, res) => {
    const code = req.query && req.query.code ? req.query.code : ''
    const id = req.query && req.query.id ? req.query.id : ''
    if (!id || !code) {
        res.json({
            success: false,
            message: 'Not enought parameters',
        })
        return
    }
    spotifyApi
        .authorizationCodeGrant(code)
        .then(response => {
            db.storeItem(id, response.body)
            res.json(Object.assign({ success: true }, response.body))
        })
        .catch(e => {
            res.json(Object.assign({}, e, { success: false }))
        })
})

app.get('/token', (req, res) => {
    const id = req.query && req.query.id ? req.query.id : ''
    if (!id) {
        res.json({
            success: false,
            message: 'Not enough parameters',
        })
        return
    }
    const item = Object.assign({}, db.loadItem(id))
    item.success = item.access_token ? true : false
    res.json(item)
})

app.get('/refresh', (req, res) => {
    const id = req.query && req.query.id ? req.query.id : ''
    if (!id) {
        res.json({
            success: false,
            message: 'Not enough parameters',
        })
        return
    }
    const item = Object.assign({}, db.loadItem(id))
    spotifyApi.setRefreshToken(item.refresh_token)
    spotifyApi
        .refreshAccessToken()
        .then(response => {
            res.json(Object.assign({ success: true }, response.body))
        })
        .catch(e => {
            res.json(Object.assign({}, e, { success: false }))
        })
})

app.listen(port, () => console.log(`Spotify Auth Server listening on port ${port}!`))

//
