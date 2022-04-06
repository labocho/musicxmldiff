# musicxmldiff

musicxmldiff is "diff" for [MusicXML](https://www.musicxml.com/).

![Demo](https://github.com/labocho/musicxmldiff/blob/master/demo.png?raw=true)

# How to use

1. Open https://musicxmldiff.penguinlab.jp/
2. Select two MusicXML files to compare
3. Select part


# Limitation

This version is "beta".

* Don't support `<score-timewise>` data.
* Don't support compressed data (.mxl).
* May not display some objects over multiple measures (eg. cresc. or slurs)
* Web app only (No desktop app).


# Development

    yarn install
    yarn start

# License

See `LICENSE`

